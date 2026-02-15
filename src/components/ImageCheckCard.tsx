import { useState, memo } from 'react';
import { urlFromBaseUrl, type TemplateCollectionItem } from '@/domain/template';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { debugLog } from '@/utils/debug';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { normalizeStatus } from '@/utils/utils';
import { ItemCounter } from './ItemCounter';

type ImageCheckCardProps = {
  collectionId: string;
  item: TemplateCollectionItem;
  lazyLoading?: boolean;
  aspectRatio?: [number, number];
};

export const ImageCheckCard = memo(function ImageCheckCard({
  collectionId,
  item,
  lazyLoading = true,
  aspectRatio,
}: ImageCheckCardProps) {
  debugLog.render.log(`ImageCheckCard render: ${collectionId} ${item.id}`);

  const enableCount = useActiveProfileStore(state =>
    profileHasFlag(state.profile!, ProfileFlags.ENABLE_COUNT)
  );

  const baseUrlConfig = useActiveProfileStore(state => state.template!.imageBaseUrl);
  const fallbackSrc = baseUrlConfig?.fallback;

  const status = useActiveProfileStore(
    state => state.profile?.collections[collectionId]?.[item.id] ?? (enableCount ? 0 : false)
  );
  const toggleStatus = useActiveProfileStore(state => state.toggleStatus);
  const setCount = useActiveProfileStore(state => state.setCount);

  const [imgSrc, setImgSrc] = useState(
    item.image ?? urlFromBaseUrl(`${collectionId}/${item.id}`, baseUrlConfig!)
  );
  const [showAlt, setShowAlt] = useState(false);

  const formatAspectRatio = (a: [number, number] | undefined): string => {
    if (!a) return item.rotated ? '10/7' : '7/10';
    return item.rotated ? `${a[1]}/${a[0]}` : `${a[0]}/${a[1]}`;
  };

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
        className="relative flex-1"
        style={
          {
            aspectRatio: formatAspectRatio(aspectRatio),
          } as React.CSSProperties
        }
      >
        {showAlt ? (
          <div
            className={`flex h-full w-full items-center justify-center bg-gray-200 p-2 text-center
              text-sm whitespace-pre-line text-gray-600 transition ${
                !normalizeStatus(status) && 'opacity-50'
              }`}
          >
            {item.name.split(' ').join('\n')}
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={item.name}
            crossOrigin="anonymous"
            loading={lazyLoading ? 'lazy' : 'eager'}
            decoding="async"
            onError={() =>
              fallbackSrc && imgSrc !== fallbackSrc ? setImgSrc(fallbackSrc) : setShowAlt(true)
            }
            className={`h-full w-full object-cover transition
              ${!normalizeStatus(status) && 'opacity-50'}`}
          />
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
              checked={normalizeStatus(status)}
              className="pointer-events-none accent-blue-600"
            />
          )}
        </div>
      </div>

      {/* Counter */}
      {enableCount && typeof status === 'number' && (
        <ItemCounter value={status} setValue={val => setCount(collectionId, item.id, val)} />
      )}
    </div>
  );
});
