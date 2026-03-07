import { type Template } from '@/domain/template';

export const formatImageUrl = (
  baseUrlInfo: Template['imageBaseUrl'],
  templateRevision: Template['revision'],
  collectionId: string,
  itemId: string
): string =>
  baseUrlInfo
    ? `${baseUrlInfo.root}/${collectionId}/${itemId}.${baseUrlInfo.format}?rev=${templateRevision}`
    : '';
