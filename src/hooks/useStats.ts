import { useMemo, useDeferredValue } from 'react';
import { useShallow } from 'zustand/shallow';
import type { TemplateCollection } from '@/domain/template';
import type { Profile } from '@/domain/profile';
import { useActiveProfile } from '@/stores/profileSessionStore';
import { normalizeStatusNumber } from '@/utils/utils';
import { debugLog } from '@/utils/debug';

type StatsCounter = {
  total: number;
  collected: number;
  owned: number;
};

type CollectionStats = {
  items: StatsCounter;
  comps: StatsCounter;
};

type CollectionStatus = Profile['collections'][string];

const EMPTY_COLLECTION_STATUS: CollectionStatus = {};

function calculateItemStats(
  collection: TemplateCollection,
  statusMap: CollectionStatus
): StatsCounter {
  let collected = 0;
  let owned = 0;

  for (const item of collection.items) {
    const count = normalizeStatusNumber(statusMap?.[item.id]);
    if (count > 0) {
      collected++;
      owned += count;
    }
  }

  return {
    total: collection.items.length,
    collected,
    owned,
  };
}

function calculateCompStats(
  collection: TemplateCollection,
  statusMap: CollectionStatus
): StatsCounter {
  let collected = 0;
  let owned = 0;

  // Minimal item count of each member
  const memberMinCounts = new Map<string, number>();

  for (const item of collection.items) {
    const count = normalizeStatusNumber(statusMap?.[item.id]);

    const members = Array.isArray(item.member) ? item.member : [item.member];
    for (const m of members) {
      memberMinCounts.set(m, Math.min(count, memberMinCounts.get(m) ?? Infinity));
    }
  }

  for (const count of memberMinCounts.values()) {
    if (count > 0) {
      collected++;
      owned += count;
    }
  }

  return {
    total: memberMinCounts.size,
    collected,
    owned,
  };
}

type StatsCache = WeakMap<TemplateCollection, WeakMap<CollectionStatus, StatsCounter>>;

const itemStatsCache: StatsCache = new WeakMap();
const compStatsCache: StatsCache = new WeakMap();

function calculateStatsCached(
  cache: StatsCache,
  calculate: (collection: TemplateCollection, statusMap: CollectionStatus) => StatsCounter,
  collection: TemplateCollection,
  statusMap: CollectionStatus
): StatsCounter {
  let cachedCollectionStats = cache.get(collection);
  if (!cachedCollectionStats) {
    cachedCollectionStats = new WeakMap();
    cache.set(collection, cachedCollectionStats);
  }

  let cachedCounter = cachedCollectionStats.get(statusMap);
  if (!cachedCounter) {
    cachedCounter = calculate(collection, statusMap);
    cachedCollectionStats.set(statusMap, cachedCounter);
  }
  return cachedCounter;
}

function calculateCollectionStats(
  visibleCollections: TemplateCollection,
  baseCollection: TemplateCollection,
  statusMap: CollectionStatus
): CollectionStats {
  return {
    items: calculateStatsCached(itemStatsCache, calculateItemStats, visibleCollections, statusMap),
    comps: calculateStatsCached(compStatsCache, calculateCompStats, baseCollection, statusMap),
  };
}

export function useCollectionStats(
  visibleCollections: TemplateCollection,
  baseCollection: TemplateCollection = visibleCollections
) {
  const statusMap = useActiveProfile(
    useShallow(state => state.profile.collections[baseCollection.id] ?? EMPTY_COLLECTION_STATUS)
  );

  return useMemo(() => {
    debugLog.perf.time(`calculateCollectionStats: ${baseCollection.id}`);
    const stats = calculateCollectionStats(visibleCollections, baseCollection, statusMap);
    debugLog.perf.timeEnd(`calculateCollectionStats: ${baseCollection.id}`);
    return stats;
  }, [baseCollection, visibleCollections, statusMap]);
}

type AggregatedCollectionStats = {
  totalCollections: number;
  items: StatsCounter;
  comps: StatsCounter;
};

function addStatsCounter(target: StatsCounter, source: StatsCounter) {
  target.total += source.total;
  target.collected += source.collected;
  target.owned += source.owned;
}

function calculateAggregatedCollectionStats(
  visibleCollectionss: TemplateCollection[],
  statusMaps: Profile['collections'],
  baseCollectionMap?: Record<string, TemplateCollection>
): AggregatedCollectionStats {
  const result: AggregatedCollectionStats = {
    totalCollections: visibleCollectionss.length,
    items: { total: 0, collected: 0, owned: 0 },
    comps: { total: 0, collected: 0, owned: 0 },
  };

  for (const c of visibleCollectionss) {
    // for global stats where visible equals base
    const baseCollection = baseCollectionMap?.[c.id] ?? c;

    const stats = calculateCollectionStats(c, baseCollection, statusMaps[baseCollection.id]);
    addStatsCounter(result.items, stats.items);
    addStatsCounter(result.comps, stats.comps);
  }

  return result;
}

export function useAggregatedCollectionStats(
  visibleCollectionss: TemplateCollection[],
  baseCollectionMap?: Record<string, TemplateCollection>
) {
  const statusMaps = useActiveProfile(state => state.profile.collections);
  // Defer the statusMaps so rapid toggles don't block the main thread on large templates
  const deferredStatusMaps = useDeferredValue(statusMaps);
  const deferredCollections = useDeferredValue(visibleCollectionss);
  const deferredBaseMap = useDeferredValue(baseCollectionMap);

  return useMemo(() => {
    debugLog.perf.time(`calculateAggregatedCollectionStats`);
    const stats = calculateAggregatedCollectionStats(
      deferredCollections,
      deferredStatusMaps,
      deferredBaseMap
    );
    debugLog.perf.timeEnd(`calculateAggregatedCollectionStats`);
    return stats;
  }, [deferredCollections, deferredBaseMap, deferredStatusMaps]);
}
