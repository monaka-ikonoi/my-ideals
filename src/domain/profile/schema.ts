import { z } from 'zod';

export const ProfileSchema = z.object({
  magic: z.literal('my-ideals-profile'),
  version: z.literal(1),
  id: z.nanoid(),
  name: z.string(),
  templateId: z.string(),
  templateLink: z.url(),
  templateRevision: z.number(),
  collections: z.record(z.string(), z.record(z.string(), z.boolean())),
});
