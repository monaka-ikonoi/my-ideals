import { useDeferredValue, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useFilteredCollections } from '@/hooks/useFilteredCollection';
import { CollectionPanel } from './CollectionPanel';
import { LoadingPage } from './ui/LoadingPage';
import { ErrorPage } from './ui/ErrorPage';
import { CollectionFilter } from './CollectionFilter';
import { ProfileInfo } from './ProfileInfo';
import { ScrollToTop } from './ui/ScrollToTop';
import { ProfileTemplateDiffDialog } from './ProfileTemplateDiffDialog';

export function CollectionPage() {
  const profile = useActiveProfileStore(state => state.profile);
  const template = useActiveProfileStore(state => state.template);
  const isLoading = useActiveProfileStore(state => state.isLoading);
  const error = useActiveProfileStore(state => state.error);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const filteredCollections = useFilteredCollections(deferredQuery);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!template || !profile) {
    return; // This should never reached
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ProfileInfo />
        <div className="my-4 border-t border-gray-200" />
        <CollectionFilter searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      {/* Collections - Virtualized*/}
      <Virtuoso
        data={filteredCollections}
        useWindowScroll
        overscan={3}
        itemContent={(_, collection) => (
          <div className="pb-6">
            <CollectionPanel collection={collection} />
          </div>
        )}
        components={{
          EmptyPlaceholder: () => (
            <div className="flex h-40 items-center justify-center text-gray-500">
              No collections found
            </div>
          ),
        }}
      />

      <ScrollToTop />

      {/* Diff Dialog */}
      <ProfileTemplateDiffDialog />
    </main>
  );
}
