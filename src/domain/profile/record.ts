export type RecordField = {
  id: string;
  type: 'boolean' | 'number';
  primary?: boolean;
};

export const RecordModes = ['standard', 'count'] as const;

export type RecordMode = (typeof RecordModes)[number];

const PresetFields: Record<RecordMode, RecordField[]> = {
  standard: [{ id: 'owned', type: 'boolean', primary: true }],
  count: [{ id: 'count', type: 'number', primary: true }],
};

// TODO: custom field support
type RecordModeSource = { mode: RecordMode };

// Resolved once per load; a custom mode will merge user-defined fields in here.
export const buildRecordFields = (source: RecordModeSource): RecordField[] =>
  PresetFields[source.mode];

export const getPrimaryField = (fields: RecordField[]): RecordField =>
  fields.find(field => field.primary)!;

export const isBooleanField = (field: RecordField): boolean => field.type === 'boolean';
export const isNumberField = (field: RecordField): boolean => field.type === 'number';
