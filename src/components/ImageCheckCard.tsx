import { useState, memo, useCallback } from 'react';
import { type TemplateCollectionItem } from '@/domain/template';
import { type TemplateResourceBaseUrl } from '@/domain/template/imageBaseUrl';
import { useImageOptions } from '@/contexts/imageOptions';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { debugLog } from '@/utils/debug';
import { normalizeStatusBoolean } from '@/utils/utils';
import { formatImageUrl } from '@/utils/templateUtils';
import { ItemCounter } from './ItemCounter';
import { CountBadge } from './CountBadge';

type ImageCheckCardProps = {
  collectionId: string;
  item: TemplateCollectionItem;
  mode?: 'normal' | 'export' | 'edit';
  aspectRatio?: string;
  enableCount: boolean;
  imageBaseUrl?: TemplateResourceBaseUrl;
  revision?: number;
  status: boolean | number | undefined;
};

export const ImageCheckCard = memo(function ImageCheckCard({
  collectionId,
  item,
  mode = 'normal',
  aspectRatio = '7/10',
  enableCount,
  imageBaseUrl,
  revision,
  status: rawStatus,
}: ImageCheckCardProps) {
  debugLog.render.log(`ImageCheckCard: ${collectionId} ${item.id}`);

  const imageOptions = useImageOptions();

  const status = rawStatus ?? (enableCount ? 0 : false);

  const handleSetCount = useCallback(
    (val: number) => useActiveProfileStore.getState().setCount(collectionId, item.id, val),
    [collectionId, item.id]
  );

  const handleToggle = useCallback(() => {
    if (!enableCount) useActiveProfileStore.getState().toggleStatus(collectionId, item.id);
  }, [enableCount, collectionId, item.id]);

  const fallbackSrc = imageBaseUrl?.fallback;
  const targetSrc = item.image ?? formatImageUrl(imageBaseUrl!, revision!, collectionId, item.id);

  const [imageStatus, setImageStatus] = useState<'loading' | 'fallback' | 'loaded' | 'failed'>(
    'loading'
  );
  const currentSrc = imageStatus === 'fallback' ? (fallbackSrc as string) : targetSrc;

  const computedAspectRatio = item.rotated
    ? aspectRatio.split('/').reverse().join('/')
    : aspectRatio;

  const isToggled = typeof status === 'boolean' ? status : status !== 0;
  const hasOpacity = mode === 'export' && !imageOptions.dimUntoggled ? false : !isToggled;
  const showBadge =
    (mode === 'export' || mode === 'edit') &&
    enableCount &&
    typeof status === 'number' &&
    status !== 0;

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-md
        ${!enableCount ? 'cursor-pointer' : ''}`}
      onClick={handleToggle}
    >
      {/* Image */}
      <div
        className="@container relative w-full shrink-0"
        style={{ aspectRatio: computedAspectRatio } as React.CSSProperties}
      >
        {/* Image placeholder: rendered underneath until the image successfully loads */}
        {imageStatus !== 'loaded' && (
          <div
            className={`absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200
            p-2 text-center text-sm whitespace-pre-line text-gray-600 transition
            ${hasOpacity ? 'opacity-50' : ''}`}
          >
            {item.name.split(' ').join('\n')}
          </div>
        )}

        {imageStatus !== 'failed' && (
          <img
            src={currentSrc}
            alt={item.name}
            crossOrigin="anonymous"
            loading={mode === 'export' ? 'eager' : 'lazy'}
            decoding={mode === 'export' ? 'sync' : 'async'}
            onLoad={() => setImageStatus('loaded')}
            onError={() =>
              setImageStatus(prev => {
                if (prev === 'loading') return fallbackSrc ? 'fallback' : 'failed';
                if (prev === 'fallback') return 'failed';
                return prev;
              })
            }
            className={`absolute inset-0 h-full w-full object-cover transition
            ${hasOpacity ? 'opacity-50' : ''}`}
          />
        )}

        {/* Count Badge */}
        {showBadge && <CountBadge count={status} rotated={item.rotated} />}

        {/* Bottom bar */}
        <div
          className={`absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50
            text-white
            ${mode === 'export' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs'}`}
        >
          <span className="truncate">{item.name}</span>
          {!enableCount && (
            <input
              id={`dummy-${collectionId}-${item.id}`}
              readOnly
              type="checkbox"
              checked={normalizeStatusBoolean(status)}
              className="pointer-events-none accent-blue-600"
            />
          )}
        </div>
      </div>

      {/* Counter */}
      {mode !== 'export' && enableCount && typeof status === 'number' && (
        <ItemCounter value={status} setValue={handleSetCount} mode={mode} />
      )}
    </div>
  );
});
