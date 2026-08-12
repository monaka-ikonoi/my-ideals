import {
  buildRecordFields,
  getPrimaryField,
  isNumberField,
  type Profile,
  type RecordMode,
} from '@/domain/profile';
import { normalizeStatusBoolean, normalizeStatusNumber } from '../utils/utils';

export function applyRecordMode(profile: Profile, mode: RecordMode) {
  const toCount = isNumberField(getPrimaryField(buildRecordFields({ mode })));
  const fromCount = isNumberField(getPrimaryField(buildRecordFields(profile)));

  if (fromCount !== toCount) {
    const convert = toCount ? normalizeStatusNumber : normalizeStatusBoolean;
    for (const collection of Object.values(profile.collections)) {
      for (const itemId of Object.keys(collection)) {
        collection[itemId] = convert(collection[itemId]);
      }
    }
  }

  profile.mode = mode;
}
