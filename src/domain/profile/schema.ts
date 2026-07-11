import { z } from 'zod';
import { ProfileFlags } from './flags';

const ProfileTemplateInfoSchema = z.object({
  link: z.string(),
  id: z.string(),
  revision: z.int(),
});

export const ProfileSchema = z
  .object({
    magic: z.literal('my-ideals-profile'),
    version: z.literal(1),
    id: z.nanoid(),
    name: z.string(),
    template: ProfileTemplateInfoSchema,
    flags: z.array(z.enum(Object.values(ProfileFlags))).optional(),
    selectedMembers: z.array(z.string()).default([]),
    collections: z.record(z.string(), z.record(z.string(), z.union([z.boolean(), z.int()]))),
    lastModified: z.number().default(0),
  })
  .superRefine((data, ctx) => {
    const enableCount = data.flags?.includes(ProfileFlags.ENABLE_COUNT) ?? false;
    const valueType = enableCount ? 'number' : 'boolean';

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
