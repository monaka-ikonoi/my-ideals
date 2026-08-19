import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type FieldCondition } from '@/services/filter';
import { getPrimaryField, isNumberField } from '@/domain/profile';
import { useActiveProfile, useProfileSessionStore } from '@/stores/profileSessionStore';

const FilterStatuses = ['all', 'owned', 'unowned', 'wanted'] as const;
type FilterStatus = (typeof FilterStatuses)[number];

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
