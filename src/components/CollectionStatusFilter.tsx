import { useTranslation } from 'react-i18next';
import type { FilterItemStatus } from '@/hooks/useFilteredCollection';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

type StatusFilterProps = {
  value: FilterItemStatus;
  setValue: (value: FilterItemStatus) => void;
};

const options = [
  { value: 'all', labelKey: 'collection.filter.status.all' },
  { value: 'owned', labelKey: 'collection.filter.status.owned' },
  { value: 'unowned', labelKey: 'collection.filter.status.unowned' },
  { value: 'wanted', labelKey: 'collection.filter.status.wanted' },
] as const;

export function CollectionStatusFilter({ value, setValue }: StatusFilterProps) {
  const { t } = useTranslation();

  const hasWanted = useActiveProfileStore(state =>
    profileHasFlag(state.profile!, ProfileFlags.ENABLE_COUNT)
  );

  return (
    <div className="inline-flex rounded-lg bg-gray-100 p-1 text-sm">
      {options
        .filter(option => (hasWanted ? true : option.value !== 'wanted'))
        .map(option => (
          <button
            key={option.value}
            onClick={() => setValue(option.value)}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              value === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(option.labelKey)}
          </button>
        ))}
    </div>
  );
}
