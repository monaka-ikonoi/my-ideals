export type RecordValue = boolean | number;
export type ItemRecord = RecordValue | Record<string, RecordValue>;

export const RECORD_FIELD_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
export const RECORD_FIELD_ID_MAX_LENGTH = 16;
export const RECORD_FIELD_NAME_MAX_LENGTH = 8;

type RecordFieldBase = {
  id: string;
  name: string;
  primary?: boolean;
  /** The record is this field's bare value rather than a `{ [id]: value }` entry. */
  root?: boolean;
};

export type RecordField = RecordFieldBase &
  ({ type: 'boolean'; default: boolean } | { type: 'number'; default: number });

export const RecordModes = ['standard', 'count', 'custom'] as const;

export type RecordMode = (typeof RecordModes)[number];

// name here is just a placeholder, it should never be shown
const PresetFields: Record<Exclude<RecordMode, 'custom'>, RecordField[]> = {
  standard: [
    { id: '_value', name: '_', type: 'boolean', default: false, primary: true, root: true },
  ],
  count: [{ id: '_value', name: '_', type: 'number', default: 0, primary: true, root: true }],
};

type RecordModeSource = { mode: RecordMode; customFields?: RecordField[] };

export const buildRecordFields = (source: RecordModeSource): RecordField[] =>
  source.mode === 'custom' ? (source.customFields ?? []) : PresetFields[source.mode];

export const getPrimaryField = (fields: RecordField[]): RecordField =>
  fields.find(field => field.primary)!;

export const getRootField = (fields: RecordField[]): RecordField | undefined =>
  fields.find(field => field.root);

export const isBooleanField = (field: RecordField): boolean => field.type === 'boolean';
export const isNumberField = (field: RecordField): boolean => field.type === 'number';
