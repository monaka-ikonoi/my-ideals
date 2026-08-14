export type RecordValue = boolean | number;
export type ItemRecord = RecordValue | Record<string, RecordValue>;

type RecordFieldBase = {
  id: string;
  primary?: boolean;
  /** The record is this field's bare value rather than a `{ [id]: value }` entry. */
  root?: boolean;
};

export type RecordField = RecordFieldBase &
  ({ type: 'boolean'; default: boolean } | { type: 'number'; default: number });

export const RecordModes = ['standard', 'count', 'custom'] as const;

export type RecordMode = (typeof RecordModes)[number];

const PresetFields: Record<Exclude<RecordMode, 'custom'>, RecordField[]> = {
  standard: [{ id: 'owned', type: 'boolean', default: false, primary: true, root: true }],
  count: [{ id: 'count', type: 'number', default: 0, primary: true, root: true }],
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
