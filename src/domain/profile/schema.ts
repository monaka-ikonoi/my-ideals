import { z } from 'zod';
import { debugLog } from '@/utils/debug';
import { ProfileFlags } from './flags';
import { RecordModes, buildRecordFields, getPrimaryField, type RecordMode } from './record';

export const CURRENT_PROFILE_VERSION = 2;

const ProfileTemplateInfoSchema = z.object({
  link: z.string(),
  id: z.string(),
  revision: z.int(),
});

const ProfileV1BaseSchema = {
  magic: z.literal('my-ideals-profile'),
  id: z.nanoid(),
  name: z.string(),
  template: ProfileTemplateInfoSchema,
  flags: z.array(z.enum(Object.values(ProfileFlags))).optional(),
  selectedMembers: z.array(z.string()).default([]),
  collections: z.record(z.string(), z.record(z.string(), z.union([z.boolean(), z.int()]))),
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
    const valueType = getPrimaryField(buildRecordFields(data)).type;

    for (const [collectionId, items] of Object.entries(data.collections)) {
      for (const [itemId, value] of Object.entries(items)) {
        if (typeof value !== valueType) {
          ctx.issues.push({
            code: 'invalid_type',
            expected: valueType,
            input: value,
            path: ['collections', collectionId, itemId],
          });
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
