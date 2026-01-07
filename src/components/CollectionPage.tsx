import { useState, useMemo } from 'react';
import type { WorkingProfile } from '@/domain/working';
import { useWorkingProfileStore } from '@/stores/workingProfileStore';
import { CollectionPanel } from './CollectionPanel';
import { LoadingPage } from './ui/LoadingPage';

function useFilteredCollections(working: WorkingProfile | null, selectedMember: string) {
  return useMemo(() => {
    if (!working) {
      return [];
    }

    if (selectedMember === 'all') {
      return working.collections;
    }

    return working.collections.map(collection => ({
      ...collection,
      items: collection.items.filter(item => item.member === selectedMember),
    }));
  }, [working, selectedMember]);
}

export function CollectionPage() {
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const working = useWorkingProfileStore(state => state.working);
  const isLoading = useWorkingProfileStore(state => state.isLoading);
  const error = useWorkingProfileStore(state => state.error);

  const filteredCollections = useFilteredCollections(working, selectedMember);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!working) {
    return; // This should never reached
  }

  console.log('Active Working Profile:', working);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* Filter */}
      <div
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <label htmlFor="member-filter" className="text-sm font-medium text-gray-700">
          メンバーで絞り込み:
        </label>
        <select
          id="member-filter"
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">すべて</option>
          {working.template.members.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
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
    </main>
  );
}
