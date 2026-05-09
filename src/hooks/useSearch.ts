import { useDeferredValue, useMemo, useState } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { type TemplateCollection } from '@/domain/template';
import { debugLog } from '@/utils/debug';
import {
  compileSearchIndex,
  compileSearchQuery,
  matchSearchIndex,
  type SearchIndex,
} from '@/utils/search';

// Index is cached per-template so it is only recompiled when the template changes
function useTemplateSearchIndex(): Map<string, SearchIndex> {
  const collections = useActiveProfileStore(state => state.template?.collections ?? []);

  return useMemo(() => {
    debugLog.perf.time('Build search index map');
    const map = new Map<string, SearchIndex>();
    for (const collection of collections) {
      map.set(
        collection.id,
        compileSearchIndex([collection.name, ...(collection.searchTerms ?? [])])
      );
    }
    debugLog.perf.timeEnd('Build search index map');
    return map;
  }, [collections]);
}

export type UseSearchResult = {
  searchedCollections: TemplateCollection[];
  searchProps: {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    searchSuggestions: string[];
  };
};

export function useSearch(currentCollections: TemplateCollection[]): UseSearchResult {
  const indexMap = useTemplateSearchIndex();

  const [searchQuery, setSearchQuery] = useState('');
  const normalizedQuery = searchQuery.trim();
  const deferredQuery = useDeferredValue(normalizedQuery);

  const compiledQuery = useMemo(() => compileSearchQuery(normalizedQuery), [normalizedQuery]);
  const compiledDeferredQuery = useMemo(() => compileSearchQuery(deferredQuery), [deferredQuery]);

  const searchedCollections = useMemo(() => {
    if (currentCollections.length === 0) return [];
    if (!compiledDeferredQuery) return currentCollections;

    debugLog.store.log(`Search with query tokens ${compiledDeferredQuery.tokens}`);
    debugLog.perf.time('Apply search');
    const result = currentCollections.filter(collection =>
      matchSearchIndex(indexMap.get(collection.id), compiledDeferredQuery)
    );
    debugLog.perf.timeEnd('Apply search');
    return result;
  }, [currentCollections, indexMap, compiledDeferredQuery]);

  const searchSuggestions = useMemo(() => {
    if (!compiledQuery) return [];

    return Array.from(
      new Set(
        currentCollections
          .filter(c => matchSearchIndex(indexMap.get(c.id), compiledQuery))
          .map(c => c.name)
      )
    );
  }, [currentCollections, indexMap, compiledQuery]);

  return {
    searchedCollections,
    searchProps: {
      searchQuery,
      setSearchQuery,
      searchSuggestions,
    },
  };
}
