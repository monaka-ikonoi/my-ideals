import { z } from 'zod';
import { TemplateResourceBaseUrlSchema } from './imageBaseUrl';

const TemplateLayoutSchema = z.object({
  aspectRatio: z
    .union([
      z.string().regex(/^[1-9]\d*\/[1-9]\d*$/, "Must be in 'x/y' format"),
      z.tuple([z.int(), z.int().min(1)]).transform(arr => `${arr[0]}/${arr[1]}`), // Handle old [x, y] format
    ])
    .optional(),
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
  searchTerms: z.array(z.string().min(1)).min(1).optional(),
  layout: TemplateLayoutSchema.optional(),
  items: z.array(TemplateCollectionItem),
});

const TemplateMigrationEntry = z.object({
  type: z.literal('replace-in-id'),
  from: z.string(),
  to: z.string(),
});

const TemplateMigrationRule = z.object({
  revision: z.int(),
  operations: z.array(TemplateMigrationEntry),
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
  migrations: z.array(TemplateMigrationRule).optional(),
  imageResourceType: z.enum(['inline', 'baseUrl']),
  imageBaseUrl: TemplateResourceBaseUrlSchema.optional(),
  layout: TemplateLayoutSchema.optional(),
  members: z.array(TemplateMember),
  collections: z.array(TemplateCollection),
});

const TemplateManifestEntrySchema = z.object({
  name: z.string().min(1),
  link: z.url().nullable(),
});

export const TemplateManifestSchema = z.object({
  magic: z.literal('my-ideals-template-manifest'),
  version: z.literal(1),
  templates: z.array(TemplateManifestEntrySchema),
});
