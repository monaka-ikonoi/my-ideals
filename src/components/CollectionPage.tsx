import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { WorkingProfile } from '@/domain/working';
import { useWorkingProfileStore } from '@/stores/workingProfileStore';
import { CollectionPanel } from './CollectionPanel';
import { LoadingPage } from './ui/LoadingPage';
import { ErrorPage } from './ui/ErrorPage';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ProfileTemplateDiffContent } from './ProfileTemplateDiffContent';
import { MemberFilter } from './MemberFilter';

function useFilteredCollections(working: WorkingProfile | null, selectedMembers: Set<string>) {
  return useMemo(() => {
    if (!working) return [];

    if (selectedMembers.size === 0) return working.collections;

    return working.collections.map(collection => ({
      ...collection,
      items: collection.items.filter(item => selectedMembers.has(item.member)),
    }));
  }, [working, selectedMembers]);
}

export function CollectionPage() {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const working = useWorkingProfileStore(state => state.working);
  const isLoading = useWorkingProfileStore(state => state.isLoading);
  const error = useWorkingProfileStore(state => state.error);

  const changes = useWorkingProfileStore(state => state.changes);
  const hasChanges = changes && (changes.added.length > 0 || changes.removed.length > 0);

  const filteredCollections = useFilteredCollections(working, selectedMembers);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!working) {
    return; // This should never reached
  }

  console.log('Active Working Profile:', working);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <MemberFilter
          members={working.template.members}
          selectedMembers={selectedMembers}
          onChange={setSelectedMembers}
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
