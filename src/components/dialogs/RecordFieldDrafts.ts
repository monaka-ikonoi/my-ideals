import { nanoid } from 'nanoid';
import {
  RECORD_FIELD_ID_PATTERN,
  getRootField,
  type RecordField,
  type RecordValue,
} from '@/domain/profile';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';

export const FieldTypes = ['boolean', 'number'] as const;

export type DraftField = {
  key: string; // used at runtime only
  isNew: boolean;
  /** Takes over the previous mode's records, so its type and primary role are fixed. */
  inherited: boolean;
  id: string;
  name: string;
  type: (typeof FieldTypes)[number];
  default: RecordValue;
  primary: boolean;
};

export const newRecordFieldDraftEntry = (primary = false): DraftField => ({
  key: nanoid(),
  isNew: true,
  inherited: false,
  id: '',
  name: '',
  type: 'boolean',
  default: false,
  primary,
});

export const buildRecordFieldDrafts = (fields?: RecordField[]): DraftField[] => {
  if (!fields) return [newRecordFieldDraftEntry(true)];

  const rootField = getRootField(fields);
  if (rootField) {
    return [
      {
        ...newRecordFieldDraftEntry(true),
        inherited: true,
        type: rootField.type,
        default: rootField.default,
        primary: true,
        id: 'owned',
      },
    ];
  }

  return fields.map(field => ({
    key: nanoid(),
    isNew: false,
    inherited: false,
    id: field.id,
    name: field.name,
    type: field.type,
    default: field.default,
    primary: field.primary ?? false,
  }));
};

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
