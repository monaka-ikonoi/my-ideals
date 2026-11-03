import {
  buildRecordFields,
  isNumberField,
  RecordFieldsSchema,
  type Profile,
  type RecordField,
  type RecordMode,
} from '@/domain/profile';
import { createDefaultRecord, readField, writeField } from '../utils/recordUtils';
import { normalizeStatusBoolean, normalizeStatusNumber } from '../utils/utils';

export type FieldMigration = {
  field: RecordField;
  source?: {
    fieldId: string;
    transform?: 'positive' | 'negative';
  };
};

export function applyRecordMode(
  profile: Profile,
  mode: RecordMode,
  fieldMigrations?: FieldMigration[]
) {
  const nextCustomFields =
    mode === 'custom'
      ? RecordFieldsSchema.parse(fieldMigrations?.map(migration => migration.field))
      : undefined;
  const fromFields = buildRecordFields(profile);
  const toFields = buildRecordFields({ mode, customFields: nextCustomFields });
  const migrations = toFields.map(field => {
    const source = fieldMigrations?.find(migration => migration.field.id === field.id)?.source;
    const sourceField = fromFields.find(from => from.id === (source ? source.fieldId : field.id));
    if (source && !sourceField) {
      throw new Error(`A valid source field is required for field "${field.id}"`);
    }
    return { field, sourceField, transform: source?.transform };
  });

  for (const collection of Object.values(profile.collections)) {
    for (const itemId of Object.keys(collection)) {
      const record = collection[itemId];

      // Rebuilt rather than patched, so keys of removed fields actually disappear.
      let migrated = createDefaultRecord(toFields);
      for (const { field, sourceField, transform } of migrations) {
        if (!sourceField) continue;
        let value = readField(record, sourceField);
        // The sign has to be resolved before coercing, or a negative count reads as unset.
        if (transform === 'positive') value = Math.max(normalizeStatusNumber(value), 0);
        if (transform === 'negative') value = Math.max(-normalizeStatusNumber(value), 0);
        value = isNumberField(field) ? normalizeStatusNumber(value) : normalizeStatusBoolean(value);
        migrated = writeField(migrated, field, value);
      }

      collection[itemId] = migrated;
    }
  }

  profile.mode = mode;
  profile.customFields = nextCustomFields;
}
