import { createContext, use } from 'react';
import { buildDefaultImageOptions, type ImageOptions } from '@/stores/settingsStore';

export const DEFAULT_IMAGE_OPTIONS: Required<ImageOptions> = buildDefaultImageOptions();

export const ImageOptionsContext = createContext<Required<ImageOptions>>(DEFAULT_IMAGE_OPTIONS);

export function useImageOptions(): Required<ImageOptions> {
  return use(ImageOptionsContext);
}
