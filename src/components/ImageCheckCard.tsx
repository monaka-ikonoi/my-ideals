import { useState, memo } from 'react';
import { useShallow } from 'zustand/shallow';
import { type TemplateCollectionItem } from '@/domain/template';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { debugLog } from '@/utils/debug';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { normalizeStatusBoolean } from '@/utils/utils';
import { formatImageUrl } from '@/utils/templateUtils';
import { ItemCounter } from './ItemCounter';
import { HeartIcon } from '@heroicons/react/24/solid';

type ImageCheckCardProps = {
  collectionId: string;
  item: TemplateCollectionItem;
  mode?: 'normal' | 'export' | 'edit';
  aspectRatio?: [number, number];
};

export const ImageCheckCard = memo(function ImageCheckCard({
  collectionId,
  item,
  mode = 'normal',
  aspectRatio,
}: ImageCheckCardProps) {
  debugLog.render.log(`ImageCheckCard render: ${collectionId} ${item.id}`);

  const enableCount = useActiveProfileStore(state =>
    profileHasFlag(state.profile!, ProfileFlags.ENABLE_COUNT)
  );

  const { imageBaseUrl, revision } = useActiveProfileStore(
    useShallow(state => ({
      imageBaseUrl: state.template?.imageBaseUrl,
      revision: state.template?.revision,
    }))
  );
  const fallbackSrc = imageBaseUrl?.fallback;
  const targetSrc = item.image ?? formatImageUrl(imageBaseUrl!, revision!, collectionId, item.id);

  const status = useActiveProfileStore(
    state => state.profile?.collections[collectionId]?.[item.id] ?? (enableCount ? 0 : false)
  );
  const toggleStatus = useActiveProfileStore(state => state.toggleStatus);
  const setCount = useActiveProfileStore(state => state.setCount);

  const formatAspectRatio = (a: [number, number] | undefined): string => {
    if (!a) return item.rotated ? '10/7' : '7/10';
    return item.rotated ? `${a[1]}/${a[0]}` : `${a[0]}/${a[1]}`;
  };

  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const isTargetFailed = failedSrc === targetSrc;
  const currentSrc = isTargetFailed && fallbackSrc ? fallbackSrc : targetSrc;
  const showAlt = isTargetFailed && (!fallbackSrc || failedSrc === fallbackSrc);

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-md
        ${!enableCount ? 'cursor-pointer' : ''} ${item.rotated ? 'col-span-2' : ''}`}
      onClick={() => {
        if (!enableCount) toggleStatus(collectionId, item.id);
      }}
    >
      {/* Image */}
      <div
        className="relative w-full shrink-0"
        style={
          {
            aspectRatio: formatAspectRatio(aspectRatio),
          } as React.CSSProperties
        }
      >
        {showAlt ? (
          <div
            className={`absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200
              p-2 text-center text-sm whitespace-pre-line text-gray-600 transition ${
                !(typeof status === 'boolean' ? status : status !== 0) && 'opacity-50'
              }`}
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
            onError={() => setFailedSrc(currentSrc)}
            className={`absolute inset-0 h-full w-full object-cover transition
              ${!(typeof status === 'boolean' ? status : status !== 0) && 'opacity-50'}`}
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
          setValue={val => setCount(collectionId, item.id, val)}
          size={mode === 'edit' ? 'large' : 'normal'}
        />
      )}
    </div>
  );
});
