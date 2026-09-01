import { type RecordField, type RecordFieldView } from '@/domain/profile';
import { normalizeStatusNumber } from '@/utils/utils';

export const COUNT_MODE_OWNED_ID = '_owned';
export const COUNT_MODE_WANTED_ID = '_wanted';

// Count mode uses signedness to keep owned and wanted in a single number
export const countModeFieldViews = (field: RecordField): RecordFieldView[] => [
  {
    id: COUNT_MODE_OWNED_ID,
    name: COUNT_MODE_OWNED_ID, // placeholder, resolved by i18n
    source: field,
    primary: true,
    transform: v => Math.max(normalizeStatusNumber(v), 0),
  },
  {
    id: COUNT_MODE_WANTED_ID,
    name: COUNT_MODE_WANTED_ID,
    source: field,
    transform: v => Math.max(-normalizeStatusNumber(v), 0),
  },
];
