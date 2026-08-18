import { createContext, use } from 'react';
import { type Template } from '@/domain/template';

export const TemplateContext = createContext<Template | null>(null);

export function useTemplate(): Template {
  const template = use(TemplateContext);
  if (!template) throw new Error('useTemplate used outside a loaded profile');
  return template;
}
