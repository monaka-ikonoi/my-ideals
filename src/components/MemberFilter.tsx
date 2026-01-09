import { type TemplateMember } from '@/domain/template';

type MemberFilterProps = {
  members: TemplateMember[];
  selectedMembers: Set<string>;
  onChange: (members: Set<string>) => void;
};

export function MemberFilter({ members, selectedMembers, onChange }: MemberFilterProps) {
  const handleToggle = (memberId: string) => {
    const next = new Set(selectedMembers);

    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }

    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {members.map(member => (
          <button
            key={member.id}
            onClick={() => handleToggle(member.id)}
            className={`rounded-full px-4 py-1.5 text-base font-medium transition-colors ${
              selectedMembers.has(member.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } `}
          >
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}
