import { useState, memo, useCallback } from 'react';
import { type TemplateCollectionItem } from '@/domain/template';
import { type TemplateResourceBaseUrl } from '@/domain/template/imageBaseUrl';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { debugLog } from '@/utils/debug';
import { normalizeStatusBoolean } from '@/utils/utils';
import { formatImageUrl } from '@/utils/templateUtils';
import { ItemCounter } from './ItemCounter';
import { HeartIcon } from '@heroicons/react/24/solid';

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
  debugLog.render.log(`ImageCheckCard render: ${collectionId} ${item.id}`);

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

  const [imageStatus, setImageStatus] = useState<'normal' | 'fallback' | 'failed'>('normal');
  const currentSrc = imageStatus === 'fallback' ? (fallbackSrc as string) : targetSrc;

  const computedAspectRatio = item.rotated
    ? aspectRatio.split('/').reverse().join('/')
    : aspectRatio;

  const isToggled = typeof status === 'boolean' ? status : status !== 0;

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-md
        ${!enableCount ? 'cursor-pointer' : ''} ${item.rotated ? 'col-span-2' : ''}`}
      onClick={handleToggle}
    >
      {/* Image */}
      <div
        className="relative w-full shrink-0"
        style={{ aspectRatio: computedAspectRatio } as React.CSSProperties}
      >
        {imageStatus === 'failed' ? (
          <div
            className={`absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200
              p-2 text-center text-sm whitespace-pre-line text-gray-600 transition
              ${isToggled ? '' : 'opacity-50'}`}
          >
            {item.name.split(' ').join('\n')}
          </div>
        ) : (
          <img
            src={currentSrc}
            alt={item.name}
            crossOrigin="anonymous"
            loading={mode === 'export' ? 'eager' : 'lazy'}
            decoding={mode === 'export' ? 'sync' : 'async'}
            onError={() =>
              setImageStatus(prevStatus => {
                if (prevStatus === 'normal') return fallbackSrc ? 'fallback' : 'failed';
                if (prevStatus === 'fallback') return 'failed';
                return prevStatus;
              })
            }
            className={`absolute inset-0 h-full w-full object-cover transition
              ${isToggled ? '' : 'opacity-50'}`}
          />
        )}

        {/* Count Badge */}
        {mode === 'export' && enableCount && typeof status === 'number' && status !== 0 && (
          <div
            className={`absolute top-1.5 right-1.5 flex h-10 min-w-10 transform-gpu items-center
            justify-center gap-1 overflow-hidden rounded-lg border px-2 text-xl font-bold
            tabular-nums backface-hidden ${
              status > 0
                ? 'text-gray-80 border-gray-200/60 bg-white/80'
                : 'border-pink-200/60 bg-pink-100/80 text-pink-600'
            }`}
          >
            {status > 0 ? (
              status
            ) : (
              <>
                <HeartIcon className="h-5 w-5" />
                {status !== -1 && <span className="leading-none">{Math.abs(status)}</span>}
              </>
            )}
          </div>
        )}

        {/* Bottom bar */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50
            px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:py-1 sm:text-xs"
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
        <ItemCounter
          value={status}
          setValue={handleSetCount}
          size={mode === 'edit' ? 'large' : 'normal'}
        />
      )}
    </div>
  );
});
