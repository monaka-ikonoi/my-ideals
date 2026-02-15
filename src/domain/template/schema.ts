import { z } from 'zod';
import { TemplateResourceBaseUrlSchema } from './imageBaseUrl';

const TemplateLayoutSchema = z.object({
  aspectRatio: z.tuple([z.int(), z.int().min(1)]).optional(),
  columns: z
    .tuple([z.int().min(1), z.int().min(1).optional(), z.int().min(1).optional()])
    .optional(),
});

const TemplateMember = z.object({
  id: z.string(),
  name: z.string(),
});

const TemplateCollectionItem = z.object({
  id: z.string(),
  member: z.string().or(z.array(z.string()).min(1)),
  name: z.string(),
  image: z.string().optional(),
  rotated: z.boolean().optional(),
});

const TemplateCollection = z.object({
  id: z.string(),
  name: z.string(),
  layout: TemplateLayoutSchema.optional(),
  items: z.array(TemplateCollectionItem),
});

export const TemplateSchema = z.object({
  magic: z.literal('my-ideals-template'),
  version: z.literal(1),
  revision: z.int(),
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  link: z.url().optional(),
  imageResourceType: z.enum(['inline', 'baseUrl']),
  imageBaseUrl: TemplateResourceBaseUrlSchema.optional(),
  layout: TemplateLayoutSchema.optional(),
  members: z.array(TemplateMember),
  collections: z.array(TemplateCollection),
});
