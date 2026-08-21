import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { type FieldCondition } from '@/services/filter';
import { getPrimaryField, isNumberField } from '@/domain/profile';
import { useActiveProfile, useProfileSessionStore } from '@/stores/profileSessionStore';
import { useDialogStore } from '@/stores/dialogStore';

const FilterStatuses = ['all', 'owned', 'unowned', 'wanted'] as const;
type FilterStatus = (typeof FilterStatuses)[number];

export function CustomFilterButton() {
  const { t } = useTranslation();

  const activeCount = useProfileSessionStore(state => state.filter.length);

  return (
    <button
      type="button"
      onClick={() => useDialogStore.getState().openEditCollectionFilter()}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium
        transition-colors ${
          activeCount > 0
            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            : 'bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
    >
      <FunnelIcon className="h-4 w-4" />
      {t('collection.filter.edit')}
      {activeCount > 0 && <span className="tabular-nums">{` (${activeCount})`}</span>}
    </button>
  );
}

export function CollectionStatusFilter() {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<FilterStatus>('all');

  const primaryField = useActiveProfile(state => getPrimaryField(state.fields));
  const setFilterConditions = useProfileSessionStore(state => state.setFilterConditions);

  const hasWanted = isNumberField(primaryField);

  // Booleans are converted to numbers and then filtered
  const predefinedOptions: Record<FilterStatus, FieldCondition[]> = {
    all: [],
    owned: [{ fieldId: primaryField.id, type: 'number', op: 'gt', value: 0 }],
    unowned: [{ fieldId: primaryField.id, type: 'number', op: 'eq', value: 0 }],
    wanted: [{ fieldId: primaryField.id, type: 'number', op: 'lt', value: 0 }],
  };

  const select = (status: FilterStatus) => {
    setSelected(status);
    setFilterConditions(predefinedOptions[status]);
  };

  return (
    <div className="inline-flex shrink-0 rounded-lg bg-gray-100 p-1 text-sm">
      {FilterStatuses.filter(status => hasWanted || status !== 'wanted').map(status => (
        <button
          key={status}
          onClick={() => select(status)}
          className={`rounded-md px-2 py-1 font-medium whitespace-nowrap transition-colors sm:px-3
          ${
            selected === status
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t(`collection.filter.status.${status}`)}
        </button>
      ))}
    </div>
  );
}
