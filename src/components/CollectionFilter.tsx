import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { CollectionStatusFilter } from './CollectionStatusFilter';
import type { FilterItemStatus } from '@/hooks/useFilteredCollection';
import { MemberSelector } from './MemberSelector';

type CollectionFilterProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hideCompleted: boolean;
  setHideCompleted: (enabled: boolean) => void;
  hiddenCount: number;
  filterStatus: FilterItemStatus;
  setFilterStatus: (status: FilterItemStatus) => void;
};

export function CollectionFilter({
  searchQuery,
  setSearchQuery,
  hideCompleted,
  setHideCompleted,
  filterStatus,
  setFilterStatus,
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
            <MemberSelector
              members={members}
              isSelected={m => selectedMembers.includes(m)}
              onSelect={m => toggleMember(m)}
            />
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
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pr-10 pl-10
              text-base focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500
              focus:outline-none sm:text-sm"
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

        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <CollectionStatusFilter value={filterStatus} setValue={setFilterStatus} />
        </div>
      </div>
    </div>
  );
}
