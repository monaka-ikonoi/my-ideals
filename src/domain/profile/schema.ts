import { z } from 'zod';
import { debugLog } from '@/utils/debug';
import { ProfileFlags } from './flags';
import {
  RECORD_FIELD_ID_MAX_LENGTH,
  RECORD_FIELD_ID_PATTERN,
  RECORD_FIELD_NAME_MAX_LENGTH,
  RECORD_FIELDS_MAX,
  RecordModes,
  buildRecordFields,
  getRootField,
  type RecordMode,
} from './record';

export const CURRENT_PROFILE_VERSION = 2;

const ProfileTemplateInfoSchema = z.object({
  link: z.string(),
  id: z.string(),
  revision: z.int(),
});

const RecordValueSchema = z.union([z.boolean(), z.int()]);

const ItemRecordSchema = z.union([RecordValueSchema, z.record(z.string(), RecordValueSchema)]);

const RecordFieldCommon = {
  id: z.string().regex(RECORD_FIELD_ID_PATTERN).max(RECORD_FIELD_ID_MAX_LENGTH),
  name: z.string().min(1).max(RECORD_FIELD_NAME_MAX_LENGTH),
  primary: z.boolean().optional(),
};

// `root` is intentionally absent: it describes a preset layout and is never user-authored.
const RecordFieldSchema = z.discriminatedUnion('type', [
  z.object({
    ...RecordFieldCommon,
    type: z.literal('boolean'),
    default: z.boolean(),
  }),
  z.object({
    ...RecordFieldCommon,
    type: z.literal('number'),
    default: z.int(),
  }),
]);

const ProfileV1BaseSchema = {
  magic: z.literal('my-ideals-profile'),
  id: z.nanoid(),
  name: z.string(),
  template: ProfileTemplateInfoSchema,
  flags: z.array(z.enum(Object.values(ProfileFlags))).optional(),
  customFields: z.array(RecordFieldSchema).max(RECORD_FIELDS_MAX).optional(),
  selectedMembers: z.array(z.string()).default([]),
  collections: z.record(z.string(), z.record(z.string(), ItemRecordSchema)),
  lastModified: z.number().default(0),
};

const ProfileV1Schema = z.object({
  ...ProfileV1BaseSchema,
  version: z.literal(1),
});

const ProfileV2Schema = z.object({
  ...ProfileV1BaseSchema,
  version: z.literal(2),
  mode: z.enum(RecordModes),
});

export const ProfileSchema = z
  .discriminatedUnion('version', [ProfileV1Schema, ProfileV2Schema])
  .transform(data => {
    if (data.version === 1) {
      data = {
        ...data,
        version: 2,
        flags: data.flags?.filter(flag => flag !== ProfileFlags.ENABLE_COUNT),
        mode: (data.flags?.includes(ProfileFlags.ENABLE_COUNT)
          ? 'count'
          : 'standard') as RecordMode,
      };
      debugLog.schema.log(`Upgraded profile ${data.name} (${data.id}) from version 1 to version 2`);
    }
    return data;
  })
  .superRefine((data, ctx) => {
    const fields = buildRecordFields(data);

    if (fields.length === 0) {
      ctx.issues.push({
        code: 'custom',
        message: 'At least one field must be defined',
        input: data.customFields,
        path: ['customFields'],
      });
      return;
    }

    if (fields.filter(field => field.primary).length !== 1) {
      ctx.issues.push({
        code: 'custom',
        message: 'Exactly one field must be marked primary',
        input: data.customFields,
        path: ['customFields'],
      });
      return;
    }

    const seenIds = new Set<string>();
    const duplicates = fields.flatMap((field, index) => {
      if (seenIds.has(field.id)) return [{ id: field.id, index }];
      seenIds.add(field.id);
      return [];
    });

    for (const { id, index } of duplicates) {
      ctx.issues.push({
        code: 'custom',
        message: `Duplicate field id: ${id}`,
        input: id,
        path: ['customFields', index, 'id'],
      });
    }

    if (duplicates.length > 0) return;

    const rootField = getRootField(fields);
    const fieldTypes = new Map(fields.map(field => [field.id, field.type]));

    for (const [collectionId, items] of Object.entries(data.collections)) {
      for (const [itemId, record] of Object.entries(items)) {
        const path = ['collections', collectionId, itemId];

        if (rootField) {
          if (typeof record !== rootField.type) {
            ctx.issues.push({
              code: 'invalid_type',
              expected: rootField.type,
              input: record,
              path,
            });
          }
          continue;
        }

        if (typeof record !== 'object') {
          ctx.issues.push({ code: 'invalid_type', expected: 'object', input: record, path });
          continue;
        }

        for (const [fieldId, value] of Object.entries(record)) {
          const type = fieldTypes.get(fieldId);
          if (!type) {
            ctx.issues.push({
              code: 'unrecognized_keys',
              keys: [fieldId],
              input: record,
              path,
            });
          } else if (typeof value !== type) {
            ctx.issues.push({
              code: 'invalid_type',
              expected: type,
              input: value,
              path: [...path, fieldId],
            });
          }
        }
      }
    }
  });

export const ProfileBundleSchema = z.object({
  magic: z.literal('my-ideals-profile-bundle'),
  version: z.literal(1),
  created: z.number(),
  profiles: z.array(ProfileSchema),
});
