import { z } from 'zod';

export type TemplateResourceBaseUrl = {
  root: string;
  format: 'jpg' | 'png' | 'webp';
  fallback: string;
};

export const TemplateResourceBaseUrlSchema = z.object({
  root: z.url(),
  format: z.enum(['jpg', 'png', 'webp']),
  fallback: z.url(),
});

export const urlFromBaseUrl = (id: string, config: TemplateResourceBaseUrl): string =>
  `${config.root}/${id}.${config.format}`;
