import { createContext, use } from 'react';
import type { Template, TemplateCollectionItem } from '@/domain/template';

type TemplateContextValue = Template & {
  formatImageUrl: (collectionId: string, item: TemplateCollectionItem) => string;
};

export function buildTemplateContext(template: Template): TemplateContextValue {
  return {
    ...template,
    formatImageUrl(collectionId, item) {
      if (item.image) return item.image;
      if (!template.imageBaseUrl) return '';

      const { root, format } = template.imageBaseUrl;
      const filename = item.imageHash ? `${item.id}.${item.imageHash}` : item.id;
      return `${root.replace(/\/+$/, '')}/${collectionId}/${filename}.${format}`;
    },
  };
}

export const TemplateContext = createContext<TemplateContextValue | null>(null);

export function useTemplate(): TemplateContextValue {
  const template = use(TemplateContext);
  if (!template) throw new Error('useTemplate used outside a loaded profile');
  return template;
}
