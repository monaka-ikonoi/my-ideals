import {
  buildRecordFields,
  getPrimaryField,
  isNumberField,
  type Profile,
  type RecordField,
  type RecordMode,
} from '@/domain/profile';
import { createDefaultRecord, readField, writeField } from '../utils/recordUtils';
import { normalizeStatusBoolean, normalizeStatusNumber } from '../utils/utils';

export function applyRecordMode(profile: Profile, mode: RecordMode, customFields?: RecordField[]) {
  const fromField = getPrimaryField(buildRecordFields(profile));
  const toFields = buildRecordFields({ mode, customFields });
  const toField = getPrimaryField(toFields);

  for (const collection of Object.values(profile.collections)) {
    for (const itemId of Object.keys(collection)) {
      const value = readField(collection[itemId], fromField);
      // Only the primary value carries over; the remaining fields start from their default.
      collection[itemId] = writeField(
        createDefaultRecord(toFields),
        toField,
        isNumberField(toField) ? normalizeStatusNumber(value) : normalizeStatusBoolean(value)
      );
    }
  }

  profile.mode = mode;
  profile.customFields = customFields;
}
