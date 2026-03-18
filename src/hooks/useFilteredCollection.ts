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

        acc.filteredCollections.push({ ...collection, items });
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

function useSearchedCollections(
  collections: TemplateCollection[],
  query: string
): TemplateCollection[] {
  return useMemo(() => {
    if (collections.length === 0) return [];
    if (!query) return collections;

    debugLog.store.log(`Search with query ${query}`);
    debugLog.perf.time('Apply search');
    const result = collections.reduce<TemplateCollection[]>((acc, collection) => {
      if (!collection.name.toLowerCase().includes(query)) return acc;
      acc.push(collection);
      return acc;
    }, []);

    debugLog.perf.timeEnd('Apply search');
    return result;
  }, [collections, query]);
}

function useSearchSuggestions(collections: TemplateCollection[], query: string): string[] {
  return useMemo(() => {
    if (!query) return [];

    return collections
      .filter(collection => collection.name.toLowerCase().includes(query))
      .map(collection => collection.name);
  }, [collections, query]);
}

export function useCollectionFilter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterItemStatus>('all');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const deferredQuery = useDeferredValue(normalizedQuery);

  debugLog.perf.time('useCollectionFilter');
  const collections = useActiveProfileStore(state => state.template?.collections) ?? [];
  const cachedStatus = useActiveProfileStore.getState().profile?.collections ?? {};

  const { filteredCollections, hiddenCount } = useFilteredCollections(
    collections,
    cachedStatus,
    hideCompleted
  );

  const visibleCollections = useVisibleCollections(cachedStatus, filteredCollections, filterStatus);

  const searchedCollections = useSearchedCollections(visibleCollections, deferredQuery);
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
    visibleCollections: searchedCollections,
    collectionMap,
    hiddenCount,
  };
}
