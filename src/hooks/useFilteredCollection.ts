import { useMemo, useState } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { type TemplateCollection } from '@/domain/template';
import { type ProfileCollection } from '@/domain/profile';
import { debugLog } from '@/utils/debug';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';

export type FilterItemStatus = 'all' | 'owned' | 'unowned' | 'wanted';

type FilteredCollectionsResult = {
  filteredCollections: TemplateCollection[];
  hiddenCount: number;
};

function useFilteredCollections(
  collections: TemplateCollection[],
  cachedStatus: ProfileCollection,
  hideCompleted: boolean
): FilteredCollectionsResult {
  const selectedMembers = useActiveProfileStore(state => state.profile?.selectedMembers);

  return useMemo((): FilteredCollectionsResult => {
    if (collections.length === 0) return { filteredCollections: [], hiddenCount: 0 };

    const selected = new Set(selectedMembers);

    if (selected.size === 0 && !hideCompleted)
      return { filteredCollections: collections, hiddenCount: 0 };

    debugLog.store.log(
      `Apply filter, members: [${[...selected].join(',')}], hideCompleted: ${hideCompleted}`
    );
    debugLog.perf.time('Apply filter');

    const result = collections.reduce<FilteredCollectionsResult>(
      (acc, collection) => {
        const items =
          selected.size === 0
            ? collection.items
            : collection.items.filter(item =>
                typeof item.member === 'string'
                  ? selected.has(item.member)
                  : item.member.some(m => selected.has(m))
              );

        if (items.length === 0) {
          return acc;
        }

        if (hideCompleted) {
          const status = cachedStatus[collection.id] ?? {};

          if (items.every(item => normalizeStatusBoolean(status[item.id]) === true)) {
            acc.hiddenCount++;
            return acc;
          }
        }

        // Reuse the original reference when items were not actually filtered
        acc.filteredCollections.push(
          items === collection.items ? collection : { ...collection, items }
        );
        return acc;
      },
      { filteredCollections: [], hiddenCount: 0 }
    );

    debugLog.perf.timeEnd('Apply filter');
    return result;
  }, [collections, cachedStatus, selectedMembers, hideCompleted]);
}

function useVisibleCollections(
  cachedStatus: ProfileCollection,
  filteredCollections: TemplateCollection[],
  itemStatus: FilterItemStatus
) {
  return useMemo(() => {
    if (itemStatus === 'all') return filteredCollections;

    debugLog.perf.log(`Apply visible filter, status: ${itemStatus}`);
    debugLog.perf.time(`Apply visible filter`);
    const result = filteredCollections.reduce<TemplateCollection[]>((acc, collection) => {
      const items = collection.items.filter(item => {
        const count = normalizeStatusNumber(cachedStatus[collection.id]?.[item.id] ?? 0);
        switch (itemStatus) {
          case 'owned':
            return count > 0;
          case 'wanted':
            return count < 0;
          case 'unowned':
            return count === 0;
          default:
            return true;
        }
      });

      if (items.length > 0) {
        // Reuse the original reference when every item passed the filter.
        acc.push(items.length === collection.items.length ? collection : { ...collection, items });
      }
      return acc;
    }, []);

    debugLog.perf.timeEnd(`Apply visible filter`);
    return result;
  }, [filteredCollections, cachedStatus, itemStatus]);
}

export function useCollectionFilter() {
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterItemStatus>('all');

  debugLog.perf.time('useCollectionFilter');
  const collections = useActiveProfileStore(state => state.template?.collections ?? []);

  // Intentionally read via getState() instead of subscribing，the filter result
  // should stay stable while the user toggles items.
  const cachedStatus = useActiveProfileStore.getState().profile?.collections ?? {};

  const { filteredCollections, hiddenCount } = useFilteredCollections(
    collections,
    cachedStatus,
    hideCompleted
  );

  const visibleCollections = useVisibleCollections(cachedStatus, filteredCollections, filterStatus);

  const collectionMap = useMemo(() => {
    const map: Record<string, TemplateCollection> = {};
    for (const collection of filteredCollections) {
      map[collection.id] = collection;
    }
    return map;
  }, [filteredCollections]);
  debugLog.perf.timeEnd('useCollectionFilter');

  return {
    filterProps: {
      hideCompleted,
      setHideCompleted,
      filterStatus,
      setFilterStatus,
    },
    filteredCollections,
    visibleCollections,
    collectionMap,
    hiddenCount,
  };
}
