import { useMemo, useState, useDeferredValue } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { type TemplateCollection } from '@/domain/template';
import { debugLog } from '@/utils/debug';
import { normalizeStatusBoolean } from '@/utils/utils';

export type FilterItemStatus = 'all' | 'owned' | 'unowned';

type FilteredCollectionsResult = {
  filteredCollections: TemplateCollection[];
  hiddenCount: number;
};

function useFilteredCollections(
  searchQuery: string,
  hideCompleted: boolean,
  itemStatus: FilterItemStatus
): FilteredCollectionsResult {
  const collections = useActiveProfileStore(state => state.template?.collections);
  const selectedMembers = useActiveProfileStore(state => state.profile?.selectedMembers);

  return useMemo((): FilteredCollectionsResult => {
    if (!collections) return { filteredCollections: [], hiddenCount: 0 };

    const selected = new Set(selectedMembers);
    const query = searchQuery.trim().toLowerCase();

    if (selected.size === 0 && !searchQuery && !hideCompleted && itemStatus === 'all')
      return { filteredCollections: collections, hiddenCount: 0 };

    debugLog.store.log(
      `Apply filter, members: [${[...selected].join(',')}], query: "${query}", hideCompleted: ${hideCompleted}`
    );
    debugLog.perf.time('Apply filter');

    const cachedStatus =
      hideCompleted || itemStatus !== 'all'
        ? useActiveProfileStore.getState().profile!.collections
        : {};

    const result = collections.reduce<FilteredCollectionsResult>(
      (acc, collection) => {
        if (query && !collection.name.toLowerCase().includes(query)) {
          return acc;
        }

        let items =
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

        const status = cachedStatus[collection.id] ?? {};

        if (hideCompleted) {
          if (items.every(item => normalizeStatusBoolean(status[item.id]) === true)) {
            acc.hiddenCount++;
            return acc;
          }
        }

        if (itemStatus !== 'all') {
          items = items.filter(item => {
            const s = normalizeStatusBoolean(status[item.id] ?? false);
            return itemStatus === 'owned' ? s === true : s === false;
          });
          if (items.length === 0) return acc;
        }

        acc.filteredCollections.push({ ...collection, items });
        return acc;
      },
      { filteredCollections: [], hiddenCount: 0 }
    );

    debugLog.perf.timeEnd('Apply filter');
    return result;
  }, [collections, selectedMembers, searchQuery, hideCompleted, itemStatus]);
}

export function useCollectionFilter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterItemStatus>('all');
  const deferredQuery = useDeferredValue(searchQuery);
  const { filteredCollections, hiddenCount } = useFilteredCollections(
    deferredQuery,
    hideCompleted,
    filterStatus
  );

  return {
    filterProps: {
      searchQuery,
      setSearchQuery,
      hideCompleted,
      setHideCompleted,
      filterStatus,
      setFilterStatus,
    },
    filteredCollections,
    hiddenCount,
  };
}
