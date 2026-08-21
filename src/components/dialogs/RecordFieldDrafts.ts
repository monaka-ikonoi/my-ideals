import { nanoid } from 'nanoid';
import { RECORD_FIELD_ID_PATTERN, type RecordField, type RecordValue } from '@/domain/profile';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';

export const FieldTypes = ['boolean', 'number'] as const;

export type DraftField = {
  key: string; // used at runtime only
  isNew: boolean;
  id: string;
  name: string;
  type: (typeof FieldTypes)[number];
  default: RecordValue;
  primary: boolean;
};

export const newRecordFieldDraftEntry = (primary = false): DraftField => ({
  key: nanoid(),
  isNew: true,
  id: '',
  name: '',
  type: 'boolean',
  default: false,
  primary,
});

export const buildRecordFieldDrafts = (fields?: RecordField[]): DraftField[] =>
  fields?.map(field => ({
    key: nanoid(),
    isNew: false,
    id: field.id,
    name: field.name,
    type: field.type,
    default: field.default,
    primary: field.primary ?? false,
  })) ?? [newRecordFieldDraftEntry(true)];

export const validateRecordFieldDrafts = (drafts: DraftField[]): boolean =>
  new Set(drafts.map(draft => draft.id)).size === drafts.length &&
  drafts.every(draft => draft.name.trim() && RECORD_FIELD_ID_PATTERN.test(draft.id));

export const parseRecordFieldDrafts = (drafts: DraftField[]): RecordField[] =>
  drafts.map(draft => {
    const base = { id: draft.id, name: draft.name, ...(draft.primary && { primary: true }) };
    return draft.type === 'number'
      ? { ...base, type: 'number', default: normalizeStatusNumber(draft.default) }
      : { ...base, type: 'boolean', default: normalizeStatusBoolean(draft.default) };
  });
