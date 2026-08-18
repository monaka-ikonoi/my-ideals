import {
  buildRecordFields,
  isNumberField,
  type Profile,
  type RecordField,
  type RecordMode,
} from '@/domain/profile';
import { createDefaultRecord, readField, writeField } from '../utils/recordUtils';
import { normalizeStatusBoolean, normalizeStatusNumber } from '../utils/utils';

export function applyRecordMode(profile: Profile, mode: RecordMode, customFields?: RecordField[]) {
  const fromFields = buildRecordFields(profile);
  const toFields = buildRecordFields({ mode, customFields });

  const fieldMap = toFields.map(field => ({
    field,
    source: fromFields.find(from => from.id === field.id),
  }));

  for (const collection of Object.values(profile.collections)) {
    for (const itemId of Object.keys(collection)) {
      const record = collection[itemId];

      // Rebuilt rather than patched, so keys of removed fields actually disappear.
      let migrated = createDefaultRecord(toFields);
      for (const { field, source } of fieldMap) {
        if (!source) continue;
        const value = readField(record, source);
        migrated = writeField(
          migrated,
          field,
          isNumberField(field) ? normalizeStatusNumber(value) : normalizeStatusBoolean(value)
        );
      }

      collection[itemId] = migrated;
    }
  }

  profile.mode = mode;
  profile.customFields = customFields;
}
