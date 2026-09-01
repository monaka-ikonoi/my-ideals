import {
  getRootField,
  type ItemRecord,
  type RecordField,
  type RecordValue,
  type RecordFieldView,
} from '@/domain/profile';

export const createDefaultRecord = (fields: RecordField[]): ItemRecord => {
  const rootField = getRootField(fields);
  if (rootField) return rootField.default;
  return Object.fromEntries(fields.map(field => [field.id, field.default]));
};

export const readField = (record: ItemRecord | undefined, field: RecordField): RecordValue => {
  if (record === undefined) return field.default;
  if (typeof record === 'object') return record[field.id] ?? field.default;
  return field.root ? record : field.default;
};

export const writeField = (
  record: ItemRecord,
  field: RecordField,
  value: RecordValue
): ItemRecord =>
  field.root ? value : { ...(typeof record === 'object' ? record : {}), [field.id]: value };

export const readRecordFieldView = (
  record: ItemRecord | undefined,
  fieldView: RecordFieldView
): RecordValue => {
  const value = readField(record, fieldView.source);
  return fieldView.transform ? fieldView.transform(value) : value;
};
