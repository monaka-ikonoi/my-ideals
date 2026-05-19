import { ZodError } from 'zod';
import { toast } from 'sonner';
import { TemplateSchema, type Template } from '@/domain/template';
import { debugLog } from './debug';
import { TemplateCache } from '@/storage/templateCache';
import { t } from '@/i18n';

const FETCH_TIMEOUT_MS = 8000;
type StaleReason = 'offline' | 'timeout' | 'network';

export type FetchTemplateResult =
  | { success: true; url: string; template: Template; stale?: boolean }
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
  const cached = await TemplateCache.getEntry(url);

  // Skip fetch when offline.
  if (cached && typeof navigator !== 'undefined' && navigator.onLine === false) {
    debugLog.network.warn(`Offline, serving cached template for ${url}`);
    toast.warning(t('toast.stale', { error: t('toast.stale-reason.offline') }));
    return { success: true, url, template: cached.template, stale: true };
  }

  let response: Response;
  try {
    const headers: Record<string, string> = {};
    if (cached?.cacheHeaders?.etag) headers['If-None-Match'] = cached.cacheHeaders.etag;
    if (cached?.cacheHeaders?.lastModified)
      headers['If-Modified-Since'] = cached.cacheHeaders.lastModified;

    const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    response = await fetch(url, { signal: combinedSignal, redirect: 'follow', headers });
  } catch (e) {
    // Throw caller-initiated abort back to caller
    if (e instanceof Error && e.name === 'AbortError' && signal?.aborted) {
      throw e;
    }

    const isTimeout = e instanceof Error && e.name === 'TimeoutError';
    const message = e instanceof Error ? e.message : 'Network error';

    if (cached) {
      const reason: StaleReason = isTimeout ? 'timeout' : 'network';
      debugLog.network.warn(`${reason} for ${url}, serving stale cache: ${message}`);
      toast.warning(
        t('toast.stale', { error: t(`toast.stale-reason.${reason}`, { message }) })
      );
      return { success: true, url, template: cached.template, stale: true };
    }
    return { success: false, error: { type: 'network', message } };
  }

  if (response.status === 304) {
    if (!cached) {
      // Should not happen (server shouldn't 304 without a prior conditional
      // request), but handle defensively.
      debugLog.network.warn(`Unexpected 304 with no cached body for ${url}`);
      return {
        success: false,
        error: { type: 'http', status: 304, statusText: response.statusText },
      };
    }

    debugLog.network.log(`304 Not Modified: ${url}`);

    // Refresh cached headers in case the server rotated the ETag
    await TemplateCache.setEntry(url, cached.template, {
      etag: response.headers.get('etag') ?? cached.cacheHeaders?.etag,
      lastModified: response.headers.get('last-modified') ?? cached.cacheHeaders?.lastModified,
    });

    return { success: true, url: response.url, template: cached.template };
  }

  if (!response.ok) {
    if (response.status >= 500 && cached) {
      debugLog.network.warn(`HTTP ${response.status} for ${url}, serving stale cache`);
      toast.warning(
        t('toast.stale', {
          error: t('toast.stale-reason.network', { message: `HTTP ${response.status}` }),
        })
      );
      return { success: true, url, template: cached.template, stale: true };
    }
    return {
      success: false,
      error: { type: 'http', status: response.status, statusText: response.statusText },
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
      success: false,
      error: { type: 'parse', message },
    };
  }

  if (expectedId && template.id !== expectedId) {
    return {
      success: false,
      error: { type: 'id-mismatch', expectedId, actualId: template.id },
    };
  }

  const cacheHeaders = {
    etag: response.headers.get('etag') ?? undefined,
    lastModified: response.headers.get('last-modified') ?? undefined,
  };
  await TemplateCache.setEntry(url, template, cacheHeaders);

  if (response.redirected) {
    debugLog.network.log(`Template URL redirected from ${url} to ${response.url}`);
    // Create a separate cache entry for the redirected URL to avoid cache misses on
    // subsequent fetches to the final URL
    await TemplateCache.setEntry(response.url, template, cacheHeaders);
  }

  debugLog.network.log(`Fetched and cached template ${template.name} (${template.id})`);
  return { success: true, url: response.url, template };
}
