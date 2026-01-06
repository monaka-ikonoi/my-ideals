import { useWorkingProfile } from '../hooks/useWorkingProfile';
import { CollectionPanel } from './CollectionPanel';
import { useState, useMemo } from 'react';
import type { WorkingProfile } from '../domain/working';

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
  const { working, isLoading, error, toggleStatus } = useWorkingProfile('development-profile00');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const filteredCollections = useFilteredCollections(working, selectedMember);

  if (isLoading) {
    return <div className="p-4">Loading…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!working) {
    return <div className="p-4 text-red-600">No working profile loaded.</div>;
  }

  console.log('Active Working Profile:', working);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3 rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
        <label htmlFor="member-filter" className="text-sm font-medium text-gray-700">
          メンバーで絞り込み:
        </label>
        <select
          id="member-filter"
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
          className="
            rounded-md border border-gray-300 
            bg-white px-3 py-2 text-sm
            shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
          "
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
          onToggle={itemId => toggleStatus(collection.id, itemId)}
        />
      ))}
    </main>
  );
}
