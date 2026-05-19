// services/templateService.ts
import { TemplateSchema, type Template } from '@/domain/template';
import { ZodError } from 'zod';
import { debugLog } from './debug';
import {
  deleteTemplateCacheEntry,
  getCachedHeaders,
  getTemplateCacheEntry,
  setTemplateCacheEntry,
  touchTemplateCacheEntry,
  type CacheHeaders,
} from '@/storage/templateCache';

export type FetchTemplateResult =
  | { success: true; url: string; template: Template }
  | { success: false; error: TemplateError };

export type TemplateError =
  | { type: 'network'; message: string }
  | { type: 'http'; status: number; statusText: string }
  | { type: 'parse'; message: string }
  | { type: 'id-mismatch'; expectedId: string; actualId: string };

export function formatTemplateError(error: TemplateError): string {
  switch (error.type) {
    case 'network':
      return error.message;
    case 'http':
      return `HTTP ${error.status}: ${error.statusText}`;
    case 'parse':
      return `Invalid template:\n${error.message}`;
    case 'id-mismatch':
      return `Template ID mismatch: expected "${error.expectedId}", got "${error.actualId}"`;
  }
}

export async function fetchTemplate(
  url: string,
  expectedId?: string,
  signal?: AbortSignal
): Promise<FetchTemplateResult> {
  const result = await fetchTemplateRaw(url, expectedId, undefined, signal);
  if (result.kind === 'not-modified') {
    // fetchTemplate is the legacy non-cache entry point; "not modified" cannot
    // happen because we never send conditional headers from here.
    return {
      success: false,
      error: { type: 'network', message: 'Unexpected 304 without cache' },
    };
  }
  return result.result;
}

type RawFetchOutcome =
  | { kind: 'success'; result: FetchTemplateResult; headers?: CacheHeaders }
  | { kind: 'not-modified'; headers: CacheHeaders };

async function fetchTemplateRaw(
  url: string,
  expectedId: string | undefined,
  conditionalHeaders: CacheHeaders | undefined,
  signal: AbortSignal | undefined
): Promise<RawFetchOutcome> {
  let response: Response;
  try {
    const headers: Record<string, string> = {};
    if (conditionalHeaders?.etag) {
      headers['If-None-Match'] = conditionalHeaders.etag;
    }
    if (conditionalHeaders?.lastModified) {
      headers['If-Modified-Since'] = conditionalHeaders.lastModified;
    }
    response = await fetch(url, {
      signal,
      redirect: 'follow',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw e;
    }
    return {
      kind: 'success',
      result: {
        success: false,
        error: {
          type: 'network',
          message: e instanceof Error ? e.message : 'Network error',
        },
      },
    };
  }

  if (response.status === 304) {
    return {
      kind: 'not-modified',
      headers: {
        etag: response.headers.get('etag'),
        lastModified: response.headers.get('last-modified'),
      },
    };
  }

  if (!response.ok) {
    return {
      kind: 'success',
      result: {
        success: false,
        error: {
          type: 'http',
          status: response.status,
          statusText: response.statusText,
        },
      },
    };
  }

  let template: Template;
  try {
    const data = await response.json();
    template = TemplateSchema.parse(data);
  } catch (e) {
    let message = 'Unknown parse error';
    if (e instanceof ZodError) {
      message = e.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
    } else if (e instanceof Error) {
      message = e.message;
    }
    return {
      kind: 'success',
      result: {
        success: false,
        error: { type: 'parse', message },
      },
    };
  }

  if (expectedId && template.id !== expectedId) {
    return {
      kind: 'success',
      result: {
        success: false,
        error: {
          type: 'id-mismatch',
          expectedId,
          actualId: template.id,
        },
      },
    };
  }

  if (response.redirected) {
    debugLog.network.log(`Template URL redirected from ${url} to ${response.url}`);
  }

  debugLog.network.log(`Fetched template ${template.name}, ${template.id}`);
  return {
    kind: 'success',
    result: { success: true, url: response.url, template },
    headers: {
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
    },
  };
}

// ===== Cache-aware fetch (SWR + ETag/If-Modified-Since) =====

export type RevalidateErrorReason =
  | { kind: 'silent'; error: TemplateError }
  | { kind: 'gone'; status: number; statusText: string };

export type FetchTemplateWithCacheOptions = {
  signal?: AbortSignal;
  /**
   * When true, skip returning a cached value synchronously and go to the
   * network. Conditional headers from the cache are still sent so the
   * server can return 304.
   */
  forceNetwork?: boolean;
  /**
   * Called when the background revalidate fetch returns a NEW template (HTTP
   * 200 + schema valid + id matches). Not called for 304.
   */
  onRevalidated?: (template: Template, url: string) => void;
  /**
   * Called when the background revalidate fetch fails. `gone` indicates a 4xx
   * that means the URL is dead; the cache entry has already been deleted.
   * `silent` covers network errors and 5xx where the cache value remains
   * authoritative.
   */
  onRevalidateError?: (reason: RevalidateErrorReason) => void;
};

export type FetchTemplateWithCacheResult =
  | { success: true; url: string; template: Template; fromCache: boolean }
  | { success: false; error: TemplateError };

// In-flight de-dup for revalidate fetches, keyed by URL.
const inflightRevalidate = new Map<string, Promise<void>>();

export async function fetchTemplateWithCache(
  url: string,
  expectedId: string | undefined,
  opts: FetchTemplateWithCacheOptions = {}
): Promise<FetchTemplateWithCacheResult> {
  const { signal, forceNetwork, onRevalidated, onRevalidateError } = opts;

  // Look up the cache first. Even when forceNetwork is true we want the
  // conditional headers so the server can return 304.
  const cachedEntry = forceNetwork ? null : await getTemplateCacheEntry(url);

  if (cachedEntry && (!expectedId || cachedEntry.template.id === expectedId)) {
    debugLog.cache.log(`hit ${url}`);
    // Kick off background revalidate (no await).
    scheduleRevalidate(url, expectedId, {
      etag: cachedEntry.etag,
      lastModified: cachedEntry.lastModified,
    }, onRevalidated, onRevalidateError);
    return {
      success: true,
      url: cachedEntry.url,
      template: cachedEntry.template,
      fromCache: true,
    };
  }

  if (cachedEntry && expectedId && cachedEntry.template.id !== expectedId) {
    debugLog.cache.log(`cached entry for ${url} has wrong id, treating as miss`);
  } else {
    debugLog.cache.log(`miss ${url}`);
  }

  // No usable cache: do a foreground fetch. If forceNetwork, still send
  // conditional headers (the server may answer 304 which we treat as "use
  // existing cache body").
  const conditional = forceNetwork ? await getCachedHeaders(url) : undefined;

  const outcome = await fetchTemplateRaw(url, expectedId, conditional ?? undefined, signal);

  if (outcome.kind === 'not-modified') {
    // forceNetwork with a cached body present: touch headers and return cache.
    await touchTemplateCacheEntry(url, outcome.headers);
    const refreshed = await getTemplateCacheEntry(url);
    if (refreshed) {
      debugLog.cache.log(`revalidate-304 (forceNetwork) ${url}`);
      return {
        success: true,
        url: refreshed.url,
        template: refreshed.template,
        fromCache: true,
      };
    }
    // Shouldn't happen, but fall through to a generic error.
    return {
      success: false,
      error: { type: 'network', message: 'Cache touch failed after 304' },
    };
  }

  const { result, headers } = outcome;

  if (result.success) {
    await setTemplateCacheEntry(result.url, result.template, headers);
    // If the canonical URL differs from the requested URL (redirect), drop the
    // original key to avoid duplicate entries.
    if (result.url !== url) {
      await deleteTemplateCacheEntry(url);
    }
    return { ...result, fromCache: false };
  }

  return result;
}

function scheduleRevalidate(
  url: string,
  expectedId: string | undefined,
  headers: CacheHeaders,
  onRevalidated: FetchTemplateWithCacheOptions['onRevalidated'],
  onRevalidateError: FetchTemplateWithCacheOptions['onRevalidateError']
): void {
  if (inflightRevalidate.has(url)) {
    debugLog.cache.log(`revalidate already in flight for ${url}`);
    return;
  }
  const task = (async () => {
    try {
      const outcome = await fetchTemplateRaw(url, expectedId, headers, undefined);
      if (outcome.kind === 'not-modified') {
        await touchTemplateCacheEntry(url, outcome.headers);
        debugLog.cache.log(`revalidate-304 ${url}`);
        return;
      }
      const { result, headers: resHeaders } = outcome;
      if (result.success) {
        await setTemplateCacheEntry(result.url, result.template, resHeaders);
        if (result.url !== url) {
          await deleteTemplateCacheEntry(url);
        }
        debugLog.cache.log(`revalidate-200 ${url}`);
        onRevalidated?.(result.template, result.url);
        return;
      }
      // Error path.
      const err = result.error;
      if (err.type === 'http' && err.status >= 400 && err.status < 500) {
        await deleteTemplateCacheEntry(url);
        debugLog.cache.warn(`revalidate-gone ${url} (HTTP ${err.status})`);
        onRevalidateError?.({ kind: 'gone', status: err.status, statusText: err.statusText });
      } else {
        debugLog.cache.warn(`revalidate failed for ${url}:`, err);
        onRevalidateError?.({ kind: 'silent', error: err });
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        debugLog.cache.warn(`revalidate threw for ${url}:`, e);
      }
    } finally {
      inflightRevalidate.delete(url);
    }
  })();
  inflightRevalidate.set(url, task);
}
