import { z } from 'zod';

export type TemplateResourceBaseUrl = {
  root: string;
  format: 'jpg' | 'png' | 'webp';
  fallback?: string;
};

export const TemplateResourceBaseUrlSchema = z.object({
  root: z.url(),
  format: z.enum(['jpg', 'png', 'webp']),
  fallback: z.url().optional(),
});
