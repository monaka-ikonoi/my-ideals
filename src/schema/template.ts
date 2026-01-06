import { z } from 'zod';

const TemplateMember = z.object({
  id: z.string(),
  name: z.string(),
});

const TemplateCollectionItem = z.object({
  id: z.string(),
  member: z.string(),
  title: z.string(),
});

const TemplateCollection = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(TemplateCollectionItem),
});

export const TemplateSchema = z.object({
  magic: z.literal('my-ideals-template'),
  version: z.literal(1),
  revision: z.number(),
  id: z.string(),
  name: z.string(),
  members: z.array(TemplateMember),
  collections: z.array(TemplateCollection),
});

export type Template = z.infer<typeof TemplateSchema>;
