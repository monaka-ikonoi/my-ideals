import { z } from 'zod';
import { TemplateResourceBaseUrlSchema } from './imageBaseUrl';

const TemplateMember = z.object({
  id: z.string(),
  name: z.string(),
});

const TemplateCollectionItem = z.object({
  id: z.string(),
  member: z.string(),
  title: z.string(),
  image: z.string().optional(),
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
  description: z.string().optional(),
  author: z.string().optional(),
  imageResourceType: z.enum(['inline', 'baseUrl']),
  imageBaseUrl: TemplateResourceBaseUrlSchema.optional(),
  members: z.array(TemplateMember),
  collections: z.array(TemplateCollection),
});
