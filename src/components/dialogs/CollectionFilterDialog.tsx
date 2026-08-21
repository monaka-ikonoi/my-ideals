import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { nanoid } from 'nanoid';
import { isNumberField, type RecordField } from '@/domain/profile';
import { type FieldCondition } from '@/services/filter';
import { useActiveProfile, useProfileSessionStore } from '@/stores/profileSessionStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DropdownSelect } from '../ui/DropdownSelect';

type NumberFilterOperator = Extract<FieldCondition, { type: 'number' }>['op'];

const OperatorSymbols: Record<NumberFilterOperator, string> = {
  gt: '>',
  gte: '≥',
  eq: '=',
  lte: '≤',
  lt: '<',
};

/** Both sides are kept so switching the field does not discard the other input. */
type Draft = {
  key: string;
  fieldId: string;
  op: NumberFilterOperator;
  value: number;
  checked: boolean;
};

const toDraft = (condition: FieldCondition): Draft => ({
  key: nanoid(),
  fieldId: condition.fieldId,
  op: condition.type === 'number' ? condition.op : 'gt',
  value: condition.type === 'number' ? condition.value : 0,
  checked: condition.type === 'boolean' ? condition.value : true,
});

const toCondition = (draft: Draft, fields: RecordField[]): FieldCondition[] => {
  const field = fields.find(candidate => candidate.id === draft.fieldId);
  if (!field) return [];

  return isNumberField(field)
    ? [{ fieldId: field.id, type: 'number', op: draft.op, value: draft.value }]
    : [{ fieldId: field.id, type: 'boolean', value: draft.checked }];
};

const inputClass = `rounded-lg border border-gray-300 px-3 py-2 text-sm
  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`;

type ConditionBlockProps = {
  draft: Draft;
  fields: RecordField[];
  onChange: (patch: Partial<Draft>) => void;
  onRemove: () => void;
};

function ConditionBlock({ draft, fields, onChange, onRemove }: ConditionBlockProps) {
  const { t } = useTranslation();

  const field = fields.find(candidate => candidate.id === draft.fieldId);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-2">
      <DropdownSelect
        className="w-28"
        options={fields.map(candidate => ({ value: candidate.id, label: candidate.name }))}
        value={draft.fieldId}
        onChange={fieldId => onChange({ fieldId })}
      />

      {field && isNumberField(field) ? (
        <>
          <DropdownSelect
            className="w-20"
            options={Object.entries(OperatorSymbols).map(([op, label]) => ({
              value: op as NumberFilterOperator,
              label,
            }))}
            value={draft.op}
            onChange={op => onChange({ op })}
          />
          {/* Uncontrolled so the box can be emptied while typing; blur settles it back. */}
          <input
            type="number"
            defaultValue={draft.value}
            onChange={e => {
              const parsed = parseInt(e.target.value, 10);
              if (Number.isSafeInteger(parsed)) onChange({ value: parsed });
            }}
            onBlur={e => {
              const parsed = parseInt(e.target.value, 10);
              const settled = Number.isSafeInteger(parsed) ? parsed : 0;
              onChange({ value: settled });
              e.target.value = String(settled);
            }}
            className={`w-16 text-center ${inputClass}`}
          />
        </>
      ) : (
        <DropdownSelect
          className="w-20"
          options={[
            { value: 'checked', label: '✓' },
            { value: 'unchecked', label: '✕' },
          ]}
          value={draft.checked ? 'checked' : 'unchecked'}
          onChange={value => onChange({ checked: value === 'checked' })}
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
        title={t('dialog.collection-filter.remove')}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

type CollectionFilterDialogProps = {
  onClose: () => void;
};

export function CollectionFilterDialog({ onClose }: CollectionFilterDialogProps) {
  const { t } = useTranslation();

  const fields = useActiveProfile(state => state.fields);
  const conditions = useProfileSessionStore(state => state.filter);
  const setFilterConditions = useProfileSessionStore(state => state.setFilterConditions);

  const [drafts, setDrafts] = useState<Draft[]>(() => conditions.map(toDraft));

  const patchDraft = (key: string, patch: Partial<Draft>) =>
    setDrafts(prev => prev.map(draft => (draft.key === key ? { ...draft, ...patch } : draft)));

  const removeDraft = (key: string) => setDrafts(prev => prev.filter(draft => draft.key !== key));

  const addDraft = () =>
    setDrafts(prev => [
      ...prev,
      { key: nanoid(), fieldId: fields[0].id, op: 'gt', value: 0, checked: true },
    ]);

  const handleApply = () => {
    setFilterConditions(drafts.flatMap(draft => toCondition(draft, fields)));
    onClose();
  };

  const handleClear = () => {
    setFilterConditions([]);
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen
      title={t('dialog.collection-filter.title')}
      options={[
        { label: t('dialog.collection-filter.clear'), value: 'clear' },
        { label: t('dialog.collection-filter.apply'), value: 'apply', variant: 'primary' },
      ]}
      onSelect={value => (value === 'clear' ? handleClear() : handleApply())}
      onCancel={onClose}
    >
      <div className="flex flex-wrap items-stretch gap-2">
        {drafts.map(draft => (
          <ConditionBlock
            key={draft.key}
            draft={draft}
            fields={fields}
            onChange={patch => patchDraft(draft.key, patch)}
            onRemove={() => removeDraft(draft.key)}
          />
        ))}

        <button
          type="button"
          onClick={addDraft}
          className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4
            py-4 text-sm text-gray-500 transition hover:border-gray-400 hover:bg-gray-50
            hover:text-gray-700"
        >
          <PlusIcon className="h-4 w-4" />
          {t('dialog.collection-filter.add')}
        </button>
      </div>
    </ConfirmDialog>
  );
}
