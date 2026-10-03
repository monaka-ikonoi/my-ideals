import { nanoid } from 'nanoid';
import {
  RecordFieldsSchema,
  getRootField,
  type RecordField,
  type RecordValue,
} from '@/domain/profile';
import { type RecordFieldWithOption, type InheritOptions } from '@/services/recordMode';
import { normalizeStatusNumber } from '@/utils/utils';

export const FieldTypes = ['boolean', 'number'] as const;

export type DraftField = {
  key: string; // used at runtime only
  isNew: boolean;
  /** Takes over the previous mode's records, so it cannot be removed. */
  inherit?: InheritOptions;
  id: string;
  name: string;
  type: (typeof FieldTypes)[number];
  /** The type the existing records are stored as, absent for fields that have none yet. */
  savedType?: (typeof FieldTypes)[number];
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
        savedType: rootField.type,
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
    savedType: field.type,
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
    savedType: 'number',
    default: normalizeStatusNumber(inherited.default),
    primary: true,
  };
  const negative: DraftField = {
    ...newRecordFieldDraftEntry(),
    inherit: 'negative',
    id: 'wanted',
    type: 'number',
    savedType: 'number',
    default: 0,
  };

  return drafts.flatMap(draft => (draft.key === inherited.key ? [positive, negative] : [draft]));
};

export const validateRecordFieldDrafts = (drafts: DraftField[]): boolean =>
  RecordFieldsSchema.safeParse(drafts).success;

export const parseRecordFieldDrafts = (drafts: DraftField[]): RecordFieldWithOption[] =>
  RecordFieldsSchema.parse(drafts).map(({ primary, ...field }, index) => ({
    ...field,
    ...(primary && { primary: true }),
    ...(drafts[index].inherit && { inherit: drafts[index].inherit }),
  }));
