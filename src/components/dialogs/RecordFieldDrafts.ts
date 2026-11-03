import { nanoid } from 'nanoid';
import {
  RecordFieldsSchema,
  getRootField,
  type RecordField,
  type RecordValue,
} from '@/domain/profile';
import { type FieldMigration } from '@/services/recordMode';
import { normalizeStatusNumber } from '@/utils/utils';

export const FieldTypes = ['boolean', 'number'] as const;

export type DraftField = {
  key: string; // used at runtime only
  isNew: boolean;
  /** Takes over the previous mode's records, so it cannot be removed. */
  source?: FieldMigration['source'];
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
        source: { fieldId: rootField.id },
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
      .filter(draft => draft.source?.transform !== 'negative')
      .map(draft =>
        draft.source?.transform === 'positive'
          ? { ...draft, source: { fieldId: draft.source.fieldId } }
          : draft
      );
  }

  const draft = drafts.find(draft => draft.source && draft.source.transform === undefined);
  if (!draft || !draft.source) return drafts;

  const positive: DraftField = {
    ...draft,
    source: { ...draft.source, transform: 'positive' },
    type: 'number',
    savedType: 'number',
    default: normalizeStatusNumber(draft.default),
    primary: true,
  };
  const negative: DraftField = {
    ...newRecordFieldDraftEntry(),
    source: { ...draft.source, transform: 'negative' },
    id: 'wanted',
    type: 'number',
    savedType: 'number',
    default: 0,
  };

  return drafts.flatMap(d => (d.key === draft.key ? [positive, negative] : [d]));
};

export const validateRecordFieldDrafts = (drafts: DraftField[]): boolean =>
  RecordFieldsSchema.safeParse(drafts).success;

export const parseRecordFieldDrafts = (drafts: DraftField[]): RecordField[] =>
  RecordFieldsSchema.parse(drafts).map(({ primary, ...field }) => ({
    ...field,
    ...(primary && { primary: true }),
  }));

export const buildFieldMigrations = (drafts: DraftField[]): FieldMigration[] =>
  parseRecordFieldDrafts(drafts).map((field, index) => ({
    field,
    ...(drafts[index].source && { source: drafts[index].source }),
  }));
