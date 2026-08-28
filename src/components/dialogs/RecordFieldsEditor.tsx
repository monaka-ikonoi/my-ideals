import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  RECORD_FIELD_ID_MAX_LENGTH,
  RECORD_FIELD_ID_PATTERN,
  RECORD_FIELD_NAME_MAX_LENGTH,
  RECORD_FIELDS_MAX,
} from '@/domain/profile';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';
import { FieldTypes, type DraftField, newRecordFieldDraftEntry } from './RecordFieldDrafts';
import { DropdownSelect } from '../ui/DropdownSelect';

const inputClass = `rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none
  disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50
  disabled:text-gray-500`;
const validClass = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
const invalidClass = 'border-red-300 focus:border-red-500 focus:ring-red-500';
const iconButtonClass = `rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600
  disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent`;
const labelClass = 'block text-xs font-medium text-gray-500';
const errorClass = 'mt-1 text-xs break-words text-red-500';
const controlBoxClass = 'mt-1 flex h-[38px] items-center justify-center';

type RecordFieldCardProps = {
  draft: DraftField;
  duplicateId: boolean;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  canMakePrimary: boolean;
  onChange: (patch: Partial<DraftField>) => void;
  onMakePrimary: () => void;
  onMove: (offset: number) => void;
  onRemove: () => void;
};

function RecordFieldCard({
  draft,
  duplicateId,
  isFirst,
  isLast,
  canRemove,
  canMakePrimary,
  onChange,
  onMakePrimary,
  onMove,
  onRemove,
}: RecordFieldCardProps) {
  const { t } = useTranslation();

  const idError = !RECORD_FIELD_ID_PATTERN.test(draft.id)
    ? t('dialog.record-fields.error-id')
    : duplicateId
      ? t('dialog.record-fields.error-id-duplicate')
      : null;
  const nameError = draft.name.trim().length === 0;

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="w-32">
          <label className={labelClass}>{t('dialog.record-fields.id-label')}</label>
          <input
            type="text"
            value={draft.id}
            maxLength={RECORD_FIELD_ID_MAX_LENGTH}
            disabled={!draft.isNew}
            onChange={e => onChange({ id: e.target.value })}
            className={`mt-1 w-full font-mono ${inputClass} ${idError ? invalidClass : validClass}`}
          />
          {idError && <p className={errorClass}>{idError}</p>}
        </div>

        <div className="w-32">
          <label className={labelClass}>{t('dialog.record-fields.name-label')}</label>
          <input
            type="text"
            value={draft.name}
            maxLength={RECORD_FIELD_NAME_MAX_LENGTH}
            onChange={e => onChange({ name: e.target.value })}
            className={`mt-1 w-full ${inputClass} ${nameError ? invalidClass : validClass}`}
          />
          {nameError && <p className={errorClass}>{t('dialog.record-fields.error-name')}</p>}
        </div>

        <div>
          <label className={labelClass}>{t('dialog.record-fields.primary-label')}</label>
          <div className={controlBoxClass}>
            <input
              type="radio"
              checked={draft.primary}
              disabled={!canMakePrimary}
              onChange={onMakePrimary}
              className="h-4 w-4 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('dialog.record-fields.type-label')}</label>
          <DropdownSelect
            className="mt-1 w-32"
            options={FieldTypes.map(type => ({
              value: type,
              label: t(`dialog.record-fields.type-${type}`),
            }))}
            value={draft.type}
            disabled={!draft.isNew || !!draft.inherit}
            onChange={type => onChange({ type, default: type === 'number' ? 0 : false })}
          />
        </div>

        <div>
          <label className={labelClass}>{t('dialog.record-fields.default-label')}</label>
          {draft.type === 'number' ? (
            <input
              type="number"
              defaultValue={normalizeStatusNumber(draft.default)}
              onChange={e => {
                const parsed = parseInt(e.target.value, 10);
                if (Number.isSafeInteger(parsed)) onChange({ default: parsed });
              }}
              onBlur={e => {
                const parsed = parseInt(e.target.value, 10);
                const settled = Number.isSafeInteger(parsed) ? parsed : 0;
                onChange({ default: settled });
                e.target.value = String(settled);
              }}
              className={`mt-1 w-14 text-center ${inputClass} ${validClass}`}
            />
          ) : (
            <div className={`${controlBoxClass} w-14`}>
              <input
                type="checkbox"
                checked={normalizeStatusBoolean(draft.default)}
                onChange={e => onChange({ default: e.target.checked })}
                className="h-4 w-4 accent-blue-600"
              />
            </div>
          )}
        </div>

        <div className="ml-auto">
          <span className={`${labelClass} invisible`}>&nbsp;</span>
          <div className={`${controlBoxClass} gap-1`}>
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={isFirst}
              className={iconButtonClass}
              title={t('dialog.record-fields.move-up')}
            >
              <ChevronUpIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={isLast}
              className={iconButtonClass}
              title={t('dialog.record-fields.move-down')}
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={!canRemove}
              className={`ml-1 ${iconButtonClass} hover:text-red-600`}
              title={t('dialog.record-fields.remove')}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {draft.inherit && (
        <p className="mt-2 text-xs text-gray-500">{t('dialog.record-fields.inherited-hint')}</p>
      )}
    </div>
  );
}

type RecordFieldsEditorProps = {
  drafts: DraftField[];
  onChange: (drafts: DraftField[]) => void;
};

export function RecordFieldsEditor({ drafts, onChange }: RecordFieldsEditorProps) {
  const { t } = useTranslation();

  const hasInherit = drafts.some(draft => draft.inherit);

  const idCounts = new Map<string, number>();
  for (const draft of drafts) idCounts.set(draft.id, (idCounts.get(draft.id) ?? 0) + 1);

  const patchDraft = (key: string, patch: Partial<DraftField>) =>
    onChange(drafts.map(draft => (draft.key === key ? { ...draft, ...patch } : draft)));

  const makePrimary = (key: string) =>
    onChange(drafts.map(draft => ({ ...draft, primary: draft.key === key })));

  const moveDraft = (key: string, offset: number) => {
    const index = drafts.findIndex(draft => draft.key === key);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= drafts.length) return;

    const next = [...drafts];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const removeDraft = (key: string) => {
    const next = drafts.filter(draft => draft.key !== key);
    onChange(
      next.some(draft => draft.primary)
        ? next
        : next.map((draft, index) => (index === 0 ? { ...draft, primary: true } : draft))
    );
  };

  const addDraft = () => onChange([...drafts, newRecordFieldDraftEntry(false)]);

  return (
    <>
      <div className="space-y-2">
        {drafts.map((draft, index) => (
          <RecordFieldCard
            key={draft.key}
            draft={draft}
            duplicateId={(idCounts.get(draft.id) ?? 0) > 1}
            isFirst={index === 0}
            isLast={index === drafts.length - 1}
            canRemove={drafts.length > 1 && !draft.inherit}
            canMakePrimary={!hasInherit}
            onChange={patch => patchDraft(draft.key, patch)}
            onMakePrimary={() => makePrimary(draft.key)}
            onMove={offset => moveDraft(draft.key, offset)}
            onRemove={() => removeDraft(draft.key)}
          />
        ))}
      </div>

      {drafts.length < RECORD_FIELDS_MAX && (
        <button
          type="button"
          onClick={addDraft}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border
            border-dashed border-gray-300 py-3 text-sm text-gray-500 transition
            hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700"
        >
          <PlusIcon className="h-4 w-4" />
          {t('dialog.record-fields.add')}
        </button>
      )}
    </>
  );
}
