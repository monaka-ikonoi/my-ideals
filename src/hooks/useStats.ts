import { useMemo } from 'react';
import type { TemplateCollection } from '@/domain/template';
import type { Profile } from '@/domain/profile';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { normalizeStatusNumber } from '@/utils/utils';
import { debugLog } from '@/utils/debug';

type CollectionStats = {
  totalItems: number;
  collectedItems: number;
  totalMembers: number;
  completedMembers: number;
  ownedItems: number;
  ownedComps: number;
};

function calculateCollectionStats(
  collection: TemplateCollection,
  statusMap: Profile['collections'][string]
): CollectionStats {
  const result = {
    totalItems: collection.items.length,
    collectedItems: 0,
    ownedItems: 0,
    totalMembers: 0,
    completedMembers: 0,
    ownedComps: 0,
  };

  // Minimal item count of different members
  const memberMinCounts = new Map<string, number>();

  for (const item of collection.items) {
    const count = normalizeStatusNumber(statusMap?.[item.id]);

    if (count > 0) {
      result.collectedItems++;
      result.ownedItems += count;
    }

    const members = Array.isArray(item.member) ? item.member : [item.member];
    for (const m of members) {
      memberMinCounts.set(m, Math.min(count, memberMinCounts.get(m) ?? Infinity));
    }
  }

  result.totalMembers = memberMinCounts.size;
  for (const count of memberMinCounts.values()) {
    if (count > 0) {
      result.completedMembers++;
      result.ownedComps += count;
    }
  }

  return result;
}

export function useCollectionStats(collection: TemplateCollection) {
  const statusMap = useActiveProfileStore(state => state.profile?.collections[collection.id]);

  return useMemo(() => {
    debugLog.perf.time(`calculateCollectionStats: ${collection.id}`);
    const stats = calculateCollectionStats(collection, statusMap ?? {});
    debugLog.perf.timeEnd(`calculateCollectionStats: ${collection.id}`);
    return stats;
  }, [collection, statusMap]);
}

type AggreatedCollectionStats = {
  totalCollections: number;
  totalItems: number;
  collectedItems: number;
  ownedItems: number;
  ownedComps: number;
};

function calculateAggreatedCollectionStats(
  collections: TemplateCollection[],
  statusMaps: Profile['collections']
): AggreatedCollectionStats {
  const result: AggreatedCollectionStats = {
    totalCollections: collections.length,
    totalItems: 0,
    collectedItems: 0,
    ownedItems: 0,
    ownedComps: 0,
  };

  for (const collection of collections) {
    const stats = calculateCollectionStats(collection, statusMaps[collection.id] ?? {});
    result.totalItems += stats.totalItems;
    result.collectedItems += stats.collectedItems;
    result.ownedItems += stats.ownedItems;
    result.ownedComps += stats.ownedComps;
  }

  return result;
}

export function useAggreatedCollectionStats(collections: TemplateCollection[]) {
  const statusMaps = useActiveProfileStore(state => state.profile?.collections);
  return useMemo(() => {
    debugLog.perf.time(`calculateAggreatedCollectionStats`);
    const stats = calculateAggreatedCollectionStats(collections, statusMaps ?? {});
    debugLog.perf.timeEnd(`calculateAggreatedCollectionStats`);
    return stats;
  }, [collections, statusMaps]);
}
