import { createStore, get, set, del, values, clear } from 'idb-keyval';
import { TemplateSchema, type Template } from '@/domain/template';
import { debugLog } from '@/utils/debug';

const MAX_ENTRIES = 20;

export type TemplateCacheEntry = {
  url: string;
  template: Template;
  fetchedAt: number;
  lastAccessedAt: number;
  etag?: string;
  lastModified?: string;
};

export type CacheHeaders = {
  etag?: string | null;
  lastModified?: string | null;
};

const cacheStore = createStore('my-ideals-cache', 'templates');

function normaliseHeaders(headers: CacheHeaders | undefined) {
  const etag = headers?.etag ?? undefined;
  const lastModified = headers?.lastModified ?? undefined;
  return {
    etag: etag || undefined,
    lastModified: lastModified || undefined,
  };
}

/**
 * Get a cached template entry. Returns null when missing or when schema
 * validation fails (treated as miss). Updates `lastAccessedAt` on hit.
 */
export async function getTemplateCacheEntry(
  url: string
): Promise<TemplateCacheEntry | null> {
  let raw: unknown;
  try {
    raw = await get<unknown>(url, cacheStore);
  } catch (e) {
    debugLog.cache.warn(`get failed for ${url}:`, e);
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Partial<TemplateCacheEntry>;

  // Re-validate the template schema (handles app upgrades that tighten schema).
  const parsed = TemplateSchema.safeParse(candidate.template);
  if (!parsed.success) {
    debugLog.cache.warn(`schema validation failed for cached ${url}, dropping`);
    void deleteTemplateCacheEntry(url);
    return null;
  }

  const entry: TemplateCacheEntry = {
    url,
    template: parsed.data,
    fetchedAt: candidate.fetchedAt ?? Date.now(),
    lastAccessedAt: Date.now(),
    etag: candidate.etag || undefined,
    lastModified: candidate.lastModified || undefined,
  };

  // Persist lastAccessedAt update; fire-and-forget.
  void set(url, entry, cacheStore).catch(e =>
    debugLog.cache.warn(`failed to update lastAccessedAt for ${url}:`, e)
  );

  return entry;
}

/**
 * Get cached headers without validating or refreshing access time. Used when
 * we want to send a conditional request even for a cache miss path
 * (e.g. forceNetwork=true).
 */
export async function getCachedHeaders(url: string): Promise<CacheHeaders | null> {
  try {
    const raw = await get<unknown>(url, cacheStore);
    if (!raw || typeof raw !== 'object') return null;
    const candidate = raw as Partial<TemplateCacheEntry>;
    return {
      etag: candidate.etag || undefined,
      lastModified: candidate.lastModified || undefined,
    };
  } catch {
    return null;
  }
}

export async function setTemplateCacheEntry(
  url: string,
  template: Template,
  headers?: CacheHeaders
): Promise<void> {
  const now = Date.now();
  const entry: TemplateCacheEntry = {
    url,
    template,
    fetchedAt: now,
    lastAccessedAt: now,
    ...normaliseHeaders(headers),
  };
  try {
    await set(url, entry, cacheStore);
    debugLog.cache.log(`stored ${url}`);
  } catch (e) {
    debugLog.cache.warn(`failed to store ${url}:`, e);
    return;
  }
  await enforceCapacity();
}

/**
 * Update headers + fetchedAt for an existing entry without rewriting the
 * template body. Used after a 304 response.
 */
export async function touchTemplateCacheEntry(
  url: string,
  headers?: CacheHeaders
): Promise<void> {
  let raw: unknown;
  try {
    raw = await get<unknown>(url, cacheStore);
  } catch {
    return;
  }
  if (!raw || typeof raw !== 'object') return;
  const existing = raw as TemplateCacheEntry;
  const merged = normaliseHeaders(headers);
  const updated: TemplateCacheEntry = {
    ...existing,
    fetchedAt: Date.now(),
    lastAccessedAt: Date.now(),
    // Preserve old header if the new response did not carry one.
    etag: merged.etag ?? existing.etag,
    lastModified: merged.lastModified ?? existing.lastModified,
  };
  try {
    await set(url, updated, cacheStore);
    debugLog.cache.log(`touched ${url}`);
  } catch (e) {
    debugLog.cache.warn(`failed to touch ${url}:`, e);
  }
}

export async function deleteTemplateCacheEntry(url: string): Promise<void> {
  try {
    await del(url, cacheStore);
    debugLog.cache.log(`deleted ${url}`);
  } catch (e) {
    debugLog.cache.warn(`failed to delete ${url}:`, e);
  }
}

export async function listTemplateCacheEntries(): Promise<TemplateCacheEntry[]> {
  try {
    const all = await values<TemplateCacheEntry>(cacheStore);
    return all.filter((e): e is TemplateCacheEntry => !!e && typeof e === 'object');
  } catch (e) {
    debugLog.cache.warn('listTemplateCacheEntries failed:', e);
    return [];
  }
}

export async function clearTemplateCache(): Promise<void> {
  try {
    await clear(cacheStore);
    debugLog.cache.log('cleared all entries');
  } catch (e) {
    debugLog.cache.warn('clear failed:', e);
  }
}

/**
 * LRU eviction. Drops least-recently-accessed entries until the entry count
 * is within the limit.
 */
async function enforceCapacity(): Promise<void> {
  const entries = await listTemplateCacheEntries();
  if (entries.length <= MAX_ENTRIES) return;

  entries.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  while (entries.length > MAX_ENTRIES) {
    const victim = entries.shift()!;
    try {
      await del(victim.url, cacheStore);
      debugLog.cache.log(`evicted ${victim.url} (LRU)`);
    } catch (e) {
      debugLog.cache.warn(`evict failed for ${victim.url}:`, e);
    }
  }
}

