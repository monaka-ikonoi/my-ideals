import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { nanoid } from 'nanoid';
import {
  RECORD_FIELD_ID_MAX_LENGTH,
  RECORD_FIELD_ID_PATTERN,
  RECORD_FIELD_NAME_MAX_LENGTH,
  type RecordField,
  type RecordValue,
} from '@/domain/profile';
import { getActiveProfile, useActiveProfile } from '@/stores/profileSessionStore';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';
import { DropdownSelect } from '../ui/DropdownSelect';
import { FullScreenModal } from '../ui/FullScreenModal';

const FieldTypes = ['boolean', 'number'] as const;

type FieldType = (typeof FieldTypes)[number];

type DraftField = {
  key: string; // used at runtime only
  isNew: boolean;
  id: string;
  name: string;
  type: FieldType;
  default: RecordValue;
  primary: boolean;
};

const toDraft = (field: RecordField): DraftField => ({
  key: nanoid(),
  isNew: false,
  id: field.id,
  name: field.name,
  type: field.type,
  default: field.default,
  primary: field.primary ?? false,
});

const toRecordField = (draft: DraftField): RecordField => {
  const base = { id: draft.id, name: draft.name, ...(draft.primary && { primary: true }) };
  return draft.type === 'number'
    ? { ...base, type: 'number', default: normalizeStatusNumber(draft.default) }
    : { ...base, type: 'boolean', default: normalizeStatusBoolean(draft.default) };
};

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
              onChange={onMakePrimary}
              className="h-4 w-4 accent-blue-600"
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
            disabled={!draft.isNew}
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
    </div>
  );
}

type RecordFieldsModalProps = {
  onClose: () => void;
};

export function RecordFieldsModal({ onClose }: RecordFieldsModalProps) {
  const { t } = useTranslation();

  const fields = useActiveProfile(state => state.fields);
  const [drafts, setDrafts] = useState<DraftField[]>(() => fields.map(toDraft));

  const idCounts = new Map<string, number>();
  for (const draft of drafts) idCounts.set(draft.id, (idCounts.get(draft.id) ?? 0) + 1);

  const isDuplicate = (draft: DraftField) => (idCounts.get(draft.id) ?? 0) > 1;
  const canSave = drafts.every(
    draft =>
      draft.name.trim().length > 0 && RECORD_FIELD_ID_PATTERN.test(draft.id) && !isDuplicate(draft)
  );

  const patchDraft = (key: string, patch: Partial<DraftField>) =>
    setDrafts(prev => prev.map(draft => (draft.key === key ? { ...draft, ...patch } : draft)));

  const makePrimary = (key: string) =>
    setDrafts(prev => prev.map(draft => ({ ...draft, primary: draft.key === key })));

  const moveDraft = (key: string, offset: number) =>
    setDrafts(prev => {
      const index = prev.findIndex(draft => draft.key === key);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removeDraft = (key: string) =>
    setDrafts(prev => {
      const next = prev.filter(draft => draft.key !== key);
      if (next.some(draft => draft.primary)) return next;
      return next.map((draft, index) => (index === 0 ? { ...draft, primary: true } : draft));
    });

  const addDraft = () =>
    setDrafts(prev => [
      ...prev,
      {
        key: nanoid(),
        isNew: true,
        id: '',
        name: '',
        type: 'boolean',
        default: false,
        primary: false,
      },
    ]);

  const handleSave = () => {
    getActiveProfile().setMode('custom', drafts.map(toRecordField));
    onClose();
  };

  return (
    <FullScreenModal isOpen title={t('dialog.record-fields.title')} onClose={onClose}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:px-6">
          <div className="space-y-2">
            {drafts.map((draft, index) => (
              <RecordFieldCard
                key={draft.key}
                draft={draft}
                duplicateId={isDuplicate(draft)}
                isFirst={index === 0}
                isLast={index === drafts.length - 1}
                canRemove={drafts.length > 1}
                onChange={patch => patchDraft(draft.key, patch)}
                onMakePrimary={() => makePrimary(draft.key)}
                onMove={offset => moveDraft(draft.key, offset)}
                onRemove={() => removeDraft(draft.key)}
              />
            ))}
          </div>

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
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
              hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </FullScreenModal>
  );
}
