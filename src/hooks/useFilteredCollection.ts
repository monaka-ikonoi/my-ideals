import { useMemo, useState, useDeferredValue } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { type TemplateCollection } from '@/domain/template';
import { debugLog } from '@/utils/debug';
import { normalizeStatusBoolean } from '@/utils/utils';

type FilteredCollectionsResult = {
  filteredCollections: TemplateCollection[];
  hiddenCount: number;
};

function useFilteredCollections(searchQuery: string, hideCompleted: boolean) {
  const collections = useActiveProfileStore(state => state.template?.collections);
  const selectedMembers = useActiveProfileStore(state => state.profile?.selectedMembers);

  return useMemo((): FilteredCollectionsResult => {
    if (!collections) return { filteredCollections: [], hiddenCount: 0 };

    const selected = new Set(selectedMembers);
    const query = searchQuery.trim().toLowerCase();

    if (selected.size === 0 && !searchQuery)
      return { filteredCollections: collections, hiddenCount: 0 };

    debugLog.store.log('Apply filter');
    debugLog.perf.time('Apply filter');

    const cachedStatus = hideCompleted
      ? useActiveProfileStore.getState().profile?.collections
      : null;

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
  }, [collections, selectedMembers, searchQuery, hideCompleted]);
}

export function useCollectionFilter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);
  const { filteredCollections, hiddenCount } = useFilteredCollections(deferredQuery, hideCompleted);

  return {
    filterProps: {
      searchQuery,
      setSearchQuery,
      hideCompleted,
      setHideCompleted,
    },
    filteredCollections,
    hiddenCount,
  };
}
