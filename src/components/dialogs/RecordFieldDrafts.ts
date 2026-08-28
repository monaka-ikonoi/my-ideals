import { nanoid } from 'nanoid';
import {
  RECORD_FIELD_ID_PATTERN,
  getRootField,
  type RecordField,
  type RecordValue,
} from '@/domain/profile';
import { type RecordFieldWithOption, type InheritOptions } from '@/services/recordMode';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';

export const FieldTypes = ['boolean', 'number'] as const;

export type DraftField = {
  key: string; // used at runtime only
  isNew: boolean;
  /** Takes over the previous mode's records, so its type and primary role are fixed. */
  inherit?: InheritOptions;
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

export const buildRecordFieldDrafts = (fields?: RecordField[]): DraftField[] => {
  if (!fields) return [newRecordFieldDraftEntry(true)];

  const rootField = getRootField(fields);
  if (rootField) {
    return [
      {
        ...newRecordFieldDraftEntry(true),
        inherit: 'value',
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
    id: field.id,
    name: field.name,
    type: field.type,
    default: field.default,
    primary: field.primary ?? false,
  }));
};

export const splitCountModeFields = (drafts: DraftField[], enabled: boolean): DraftField[] => {
  if (!enabled) {
    return drafts
      .filter(draft => draft.inherit !== 'negative')
      .map(draft => (draft.inherit === 'positive' ? { ...draft, inherit: 'value' } : draft));
  }

  const inherited = drafts.find(draft => draft.inherit === 'value');
  if (!inherited) return drafts;

  const positive: DraftField = {
    ...inherited,
    inherit: 'positive',
    type: 'number',
    primary: true,
  };
  const negative: DraftField = {
    ...newRecordFieldDraftEntry(),
    inherit: 'negative',
    id: 'wanted',
    type: 'number',
    default: 0,
  };

  return drafts.flatMap(draft => (draft.key === inherited.key ? [positive, negative] : [draft]));
};

export const validateRecordFieldDrafts = (drafts: DraftField[]): boolean =>
  new Set(drafts.map(draft => draft.id)).size === drafts.length &&
  drafts.every(draft => draft.name.trim() && RECORD_FIELD_ID_PATTERN.test(draft.id));

export const parseRecordFieldDrafts = (drafts: DraftField[]): RecordFieldWithOption[] =>
  drafts.map(draft => {
    const base = {
      id: draft.id,
      name: draft.name,
      ...(draft.primary && { primary: true }),
      ...(draft.inherit && { inherit: draft.inherit }),
    };
    return draft.type === 'number'
      ? { ...base, type: 'number', default: normalizeStatusNumber(draft.default) }
      : { ...base, type: 'boolean', default: normalizeStatusBoolean(draft.default) };
  });
