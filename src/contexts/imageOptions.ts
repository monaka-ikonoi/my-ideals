import { createContext, use } from 'react';
import { buildDefaultImageOptions, type ImageOptions } from '@/stores/settingsStore';
import type { BadgeMap } from '@/components/card/BadgeProps';

/** Badges depend on the profile's fields, so they are resolved per render rather than persisted. */
export type ImageRenderOptions = Required<ImageOptions> & { badges: BadgeMap };

export const DEFAULT_IMAGE_OPTIONS: ImageRenderOptions = {
  ...buildDefaultImageOptions(),
  badges: {},
};

export const ImageOptionsContext = createContext<ImageRenderOptions>(DEFAULT_IMAGE_OPTIONS);

export function useImageOptions(): ImageRenderOptions {
  return use(ImageOptionsContext);
}
