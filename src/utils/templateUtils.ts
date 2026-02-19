import { type Template } from '@/domain/template';

export const formatImageUrl = (
  collectionId: string,
  templateId: string,
  template: Template
): string =>
  template.imageBaseUrl
    ? `${template.imageBaseUrl.root}/${collectionId}/${templateId}.${template.imageBaseUrl.format}?rev=${template.revision}`
    : '';
