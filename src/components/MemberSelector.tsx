import type { TemplateMember } from '@/domain/template';

type MemberSelectorProps = {
  members: TemplateMember[];
  isSelected: (memberId: string) => boolean;
  onSelect: (memberId: string) => void;
};

export function MemberSelector({ members, isSelected, onSelect }: MemberSelectorProps) {
  return (
    <>
      {members.map(member => (
        <button
          key={member.id}
          onClick={() => onSelect(member.id)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            isSelected(member.id)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {member.name}
        </button>
      ))}
    </>
  );
}
