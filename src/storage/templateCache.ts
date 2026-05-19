import { createStore, get, set, del, clear, entries } from 'idb-keyval';
import { z } from 'zod';
import { TemplateSchema, type Template } from '@/domain/template';
import { debugLog } from '@/utils/debug';

const MAX_ENTRIES = 20;

export type CacheHeaders = {
  etag?: string;
  lastModified?: string;
};

export type TemplateCacheEntry = {
  template: Template;
  lastAccessed: number;
  cacheHeaders?: CacheHeaders;
};

const TemplateCacheEntrySchema = z.object({
  template: TemplateSchema,
  lastAccessed: z.number(),
  cacheHeaders: z
    .object({
      etag: z.string().optional(),
      lastModified: z.string().optional(),
    })
    .optional(),
});

const cacheStore = createStore('my-ideals-template-cache', 'templates');

const getEntry = async (url: string): Promise<TemplateCacheEntry | null> => {
  let raw: unknown;
  try {
    raw = await get<unknown>(url, cacheStore);
    if (!raw) {
      return null;
    }
  } catch (e) {
    debugLog.storage.error(`Unable to get cached template: ${url}:`, e);
    return null;
  }

  const parsed = TemplateCacheEntrySchema.safeParse(raw);
  if (!parsed.success) {
    debugLog.storage.warn(`Cached template ${url} validation failed, dropping`);
    void del(url, cacheStore);
    return null;
  }

  const touched = { ...parsed.data, lastAccessed: Date.now() };
  void set(url, touched, cacheStore).catch(e =>
    debugLog.storage.warn(`Failed to update lastAccessed for ${url}:`, e)
  );
  return touched;
};

const setEntry = async (url: string, template: Template, headers?: CacheHeaders): Promise<void> => {
  const now = Date.now();
  const entry: TemplateCacheEntry = {
    template,
    lastAccessed: now,
    cacheHeaders: headers,
  };
  try {
    await set(url, entry, cacheStore);
  } catch (e) {
    debugLog.storage.warn(`Failed to set cache entry for ${url}:`, e);
    return;
  }
  await applyLru();
};

async function applyLru(): Promise<void> {
  const allEntries = await entries<string, unknown>(cacheStore);
  if (allEntries.length <= MAX_ENTRIES) return;

  const validEntries: [string, number][] = [];
  const invalidKeys: string[] = [];
  for (const [key, value] of allEntries) {
    const parsed = TemplateCacheEntrySchema.safeParse(value);
    if (parsed.success) {
      validEntries.push([key, parsed.data.lastAccessed]);
    } else {
      invalidKeys.push(key);
    }
  }

  // Evict invalid entries
  for (const url of invalidKeys) {
    try {
      await del(url, cacheStore);
      debugLog.storage.warn(`LRU: dropped invalid entry ${url}`);
    } catch (e) {
      debugLog.storage.warn(`LRU: failed to drop invalid entry ${url}:`, e);
    }
  }

  // LRU eviction on valid entries
  if (validEntries.length <= MAX_ENTRIES) return;

  validEntries.sort((a, b) => a[1] - b[1]);
  for (const victim of validEntries.slice(0, validEntries.length - MAX_ENTRIES)) {
    try {
      await del(victim[0], cacheStore);
      debugLog.storage.log(`LRU: evicted ${victim[0]}`);
    } catch (e) {
      debugLog.storage.warn(`LRU: evict failed for ${victim[0]}:`, e);
    }
  }
}

const clearEntries = async (): Promise<void> => {
  try {
    await clear(cacheStore);
    debugLog.storage.log('Template cache cleared');
  } catch (e) {
    debugLog.storage.error('Failed to clear template cache:', e);
  }
};

export const TemplateCache = {
  getEntry,
  setEntry,
  clearEntries,
};
