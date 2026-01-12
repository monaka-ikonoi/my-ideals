import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { WorkingProfile } from '@/domain/working';
import { useWorkingProfileStore } from '@/stores/workingProfileStore';
import { CollectionPanel } from './CollectionPanel';
import { LoadingPage } from './ui/LoadingPage';
import { ErrorPage } from './ui/ErrorPage';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ProfileTemplateDiffContent } from './ProfileTemplateDiffContent';
import { CollectionFilter } from './CollectionFilter';
import { ProfileInfo } from './ProfileInfo';
import { useProfileListStore } from '@/stores/profileListStore';

function useFilteredCollections(
  working: WorkingProfile | null,
  selectedMembers: Set<string>,
  searchQuery: string
) {
  return useMemo(() => {
    if (!working) return [];

    const query = searchQuery.trim().toLowerCase();

    if (selectedMembers.size === 0 && !searchQuery) return working.collections;

    return working.collections
      .filter(collection => {
        if (!query) return true;
        return collection.name.toLowerCase().includes(query);
      })
      .map(collection => ({
        ...collection,
        items:
          selectedMembers.size === 0
            ? collection.items
            : collection.items.filter(item => selectedMembers.has(item.member)),
      }))
      .filter(collection => collection.items.length > 0);
  }, [working, selectedMembers, searchQuery]);
}

export function CollectionPage() {
  const working = useWorkingProfileStore(state => state.working);
  const isLoading = useWorkingProfileStore(state => state.isLoading);
  const error = useWorkingProfileStore(state => state.error);

  const changes = useWorkingProfileStore(state => state.changes);
  const hasChanges = changes && (changes.added.length > 0 || changes.removed.length > 0);

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCollections = useFilteredCollections(working, selectedMembers, searchQuery);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!working) {
    return; // This should never reached
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <ProfileInfo
          working={working}
          renameFn={name => {
            useWorkingProfileStore.getState().updateName(name);
            useProfileListStore.getState().renameProfile(working.profile.id, name);
          }}
        />
        <div className="my-4 border-t border-gray-200" />
        <CollectionFilter
          members={working.template.members}
          selectedMembers={selectedMembers}
          onMemberChange={setSelectedMembers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Collections */}
      {filteredCollections.map(collection => (
        <CollectionPanel
          key={collection.id}
          id={collection.id}
          name={collection.name}
          items={collection.items}
        />
      ))}

      {/* Diff Dialog */}
      {createPortal(
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
      )}
    </main>
  );
}
