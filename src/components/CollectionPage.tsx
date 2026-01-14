import { useState } from 'react';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { CollectionPanel } from './CollectionPanel';
import { LoadingPage } from './ui/LoadingPage';
import { ErrorPage } from './ui/ErrorPage';
import { CollectionFilter } from './CollectionFilter';
import { ProfileInfo } from './ProfileInfo';
import { useFilteredCollections } from '@/hooks/useFilteredCollection';

export function CollectionPage() {
  const profile = useActiveProfileStore(state => state.profile);
  const template = useActiveProfileStore(state => state.template);
  const isLoading = useActiveProfileStore(state => state.isLoading);
  const error = useActiveProfileStore(state => state.error);

  // const changes = useWorkingProfileStore(state => state.changes);
  // const hasChanges = changes && (changes.added.length > 0 || changes.removed.length > 0);

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCollections = useFilteredCollections(selectedMembers, searchQuery);

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
        <CollectionFilter
          members={template.members}
          selectedMembers={selectedMembers}
          onMemberChange={setSelectedMembers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Collections */}
      {filteredCollections.map(collection => (
        <CollectionPanel key={collection.id} collection={collection} />
      ))}

      {/* Diff Dialog */}
      {/* {createPortal(
        <ConfirmDialog
          isOpen={!!hasChanges}
          title="Template Updated"
          message={<ProfileTemplateDiffContent working={working} changes={changes} />}
          options={[{ label: 'Got it', value: 'ok', variant: 'primary' }]}
          showCancel={false}
          onSelect={() => useWorkingProfileStore.setState({ changes: null })}
          onCancel={() => useWorkingProfileStore.setState({ changes: null })}
        />,
        document.body
      )} */}
    </main>
  );
}
