import {
  buildRecordFields,
  getPrimaryField,
  type RecordField,
  type RecordModeSource,
  type RecordValue,
} from './record';
import { countModeFieldViews } from '@/misc/CountMode';

export type RecordFieldView = {
  id: string;
  name: string;
  source: RecordField;
  transform?: (value: RecordValue) => RecordValue;
  primary?: boolean;
};

export const buildRecordFieldViews = (source: RecordModeSource): RecordFieldView[] => {
  const fields = buildRecordFields(source);
  if (source.mode === 'count') return countModeFieldViews(getPrimaryField(fields));

  return fields.map(field => ({
    id: field.id,
    name: field.name,
    source: field,
    primary: field.primary,
  }));
};

export const getPrimaryFieldView = (fieldViews: RecordFieldView[]): RecordFieldView =>
  fieldViews.find(fieldView => fieldView.primary)!;
