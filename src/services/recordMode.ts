import {
  buildRecordFields,
  getRootField,
  isNumberField,
  type Profile,
  type RecordField,
  type RecordMode,
} from '@/domain/profile';
import { createDefaultRecord, readField, writeField } from '../utils/recordUtils';
import { normalizeStatusBoolean, normalizeStatusNumber } from '../utils/utils';

export type InheritOptions = 'value' | 'positive' | 'negative';
export type RecordFieldWithOption = RecordField & { inherit?: InheritOptions };

export function applyRecordMode(
  profile: Profile,
  mode: RecordMode,
  customFields?: RecordFieldWithOption[]
) {
  const fromFields = buildRecordFields(profile);
  const toFields = buildRecordFields({ mode, customFields });

  const fieldMap = toFields.map(field => {
    const inherit = customFields?.find(f => f.id === field.id)?.inherit;
    return {
      field,
      inherit,
      // `_value` is used as the internal ID for non-custom modes, since ID cannot be starting
      // with underscore in custom mode, move the values to the primary field when switching
      // to custom mode.
      source:
        fromFields.find(from => from.id === field.id) ??
        (inherit ? getRootField(fromFields) : undefined),
    };
  });

  for (const collection of Object.values(profile.collections)) {
    for (const itemId of Object.keys(collection)) {
      const record = collection[itemId];

      // Rebuilt rather than patched, so keys of removed fields actually disappear.
      let migrated = createDefaultRecord(toFields);
      for (const { field, inherit, source } of fieldMap) {
        if (!source) continue;
        let value = readField(record, source);
        // The sign has to be resolved before coercing, or a negative count reads as unset.
        if (inherit === 'positive') value = Math.max(normalizeStatusNumber(value), 0);
        if (inherit === 'negative') value = Math.max(-normalizeStatusNumber(value), 0);
        value = isNumberField(field) ? normalizeStatusNumber(value) : normalizeStatusBoolean(value);
        migrated = writeField(migrated, field, value);
      }

      collection[itemId] = migrated;
    }
  }

  profile.mode = mode;
  profile.customFields = customFields?.map(({ inherit: _inherit, ...field }) => field);
}
