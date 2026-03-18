import { useMemo, useState, useDeferredValue } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { type TemplateCollection } from '@/domain/template';
import { type ProfileCollection } from '@/domain/profile';
import { debugLog } from '@/utils/debug';
import { normalizeStatusBoolean } from '@/utils/utils';

export type FilterItemStatus = 'all' | 'owned' | 'unowned';

type FilteredCollectionsResult = {
  filteredCollections: TemplateCollection[];
  hiddenCount: number;
};

function useFilteredCollections(
  cachedStatus: ProfileCollection,
  searchQuery: string,
  hideCompleted: boolean
): FilteredCollectionsResult {
  const collections = useActiveProfileStore(state => state.template?.collections);
  const selectedMembers = useActiveProfileStore(state => state.profile?.selectedMembers);

  return useMemo((): FilteredCollectionsResult => {
    if (!collections) return { filteredCollections: [], hiddenCount: 0 };

    const selected = new Set(selectedMembers);
    const query = searchQuery.trim().toLowerCase();

    if (selected.size === 0 && !searchQuery && !hideCompleted)
      return { filteredCollections: collections, hiddenCount: 0 };

    debugLog.store.log(
      `Apply filter, members: [${[...selected].join(',')}], query: "${query}", hideCompleted: ${hideCompleted}`
    );
    debugLog.perf.time('Apply filter');

    const result = collections.reduce<FilteredCollectionsResult>(
      (acc, collection) => {
        if (query && !collection.name.toLowerCase().includes(query)) {
          return acc;
        }

        const items =
          selected.size === 0
            ? collection.items
            : collection.items.filter(item =>
                typeof item.member === 'string'
                  ? selected.has(item.member)
                  : item.member.some(m => selected.has(m))
              );

        if (items.length == 0) {
          return acc;
        }

        if (hideCompleted && cachedStatus) {
          const status = cachedStatus[collection.id] ?? {};

          if (items.every(item => normalizeStatusBoolean(status[item.id]) === true)) {
            acc.hiddenCount++;
            return acc;
          }
        }

        acc.filteredCollections.push({ ...collection, items });
        return acc;
      },
      { filteredCollections: [], hiddenCount: 0 }
    );

    debugLog.perf.timeEnd('Apply filter');
    return result;
  }, [collections, cachedStatus, selectedMembers, searchQuery, hideCompleted]);
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
        const owned = normalizeStatusBoolean(cachedStatus[collection.id]?.[item.id] ?? false);
        return itemStatus === 'owned' ? owned : !owned;
      });

      if (items.length > 0) {
        acc.push({ ...collection, items });
      }
      return acc;
    }, []);

    debugLog.perf.timeEnd(`Apply visible filter`);
    return result;
  }, [filteredCollections, cachedStatus, itemStatus]);
}

function useSearchSuggestions(collections: TemplateCollection[], searchQuery: string): string[] {
  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return collections
      .filter(collection => collection.name.toLowerCase().includes(query))
      .map(collection => collection.name);
  }, [collections, searchQuery]);
}

export function useCollectionFilter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterItemStatus>('all');
  const deferredQuery = useDeferredValue(searchQuery);

  debugLog.perf.time('useCollectionFilter');
  const cachedStatus = useActiveProfileStore.getState().profile?.collections ?? {};
  const { filteredCollections, hiddenCount } = useFilteredCollections(
    cachedStatus,
    deferredQuery,
    hideCompleted
  );

  const visibleCollections = useVisibleCollections(cachedStatus, filteredCollections, filterStatus);

  const searchSuggestions = useSearchSuggestions(visibleCollections, searchQuery);

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
      searchProps: {
        searchQuery,
        setSearchQuery,
        searchSuggestions,
      },
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
