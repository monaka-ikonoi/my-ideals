import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { type TemplateMember } from '@/domain/template';

type CollectionFilterProps = {
  members: TemplateMember[];
  selectedMembers: Set<string>;
  onMemberChange: (members: Set<string>) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export function CollectionFilter({
  members,
  selectedMembers,
  onMemberChange,
  searchQuery,
  onSearchChange,
}: CollectionFilterProps) {
  const handleMemberToggle = (memberId: string) => {
    const next = new Set(selectedMembers);

    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }

    onMemberChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {members.map(member => (
          <button
            key={member.id}
            onClick={() => handleMemberToggle(member.id)}
            className={`rounded-full px-4 py-1.5 text-base font-medium transition-colors ${
              selectedMembers.has(member.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {member.name}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-200" />

      <div className="relative">
        <MagnifyingGlassIcon
          className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search collections..."
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-10 pl-10 text-base
            focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500
            focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
