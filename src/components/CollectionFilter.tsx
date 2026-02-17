import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

type CollectionFilterProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hideCompleted: boolean;
  setHideCompleted: (enabled: boolean) => void;
  hiddenCount: number;
};

export function CollectionFilter({
  searchQuery,
  setSearchQuery,
  hideCompleted,
  setHideCompleted,
  hiddenCount,
}: CollectionFilterProps) {
  const { t } = useTranslation();

  const members = useActiveProfileStore(state => state.template!.members);
  const selectedMembers = useActiveProfileStore(state => state.profile!.selectedMembers);
  const toggleMember = useActiveProfileStore(state => state.toggleMember);

  return (
    <div className="space-y-3">
      {members.length > 1 && (
        <>
          <div className="flex flex-wrap gap-2">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedMembers.includes(member.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200" />
        </>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('collection.search-placeholder')}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-10 pl-10 text-sm
              focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500
              focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400
                hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={e => setHideCompleted(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {t('collection.hide-completed')}
            <span
              className={`tabular-nums ${hiddenCount > 0 ? 'visible' : 'invisible'}`}
            >{` (${hiddenCount})`}</span>
          </span>
        </label>
      </div>
    </div>
  );
}
