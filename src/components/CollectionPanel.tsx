import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type TemplateCollection } from '@/domain/template';
import { ImageCheckCard } from './ImageCheckCard';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

type CollectionPanelProps = {
  collection: TemplateCollection;
};

export const CollectionPanel = memo(function CollectionPanel({ collection }: CollectionPanelProps) {
  debugLog.render.log(`CollectionPanel render: ${collection.id}`);

  const { t } = useTranslation();

  const layout = collection.layout ?? useActiveProfileStore.getState().template?.layout;

  const statusMap = useActiveProfileStore(state => state.profile?.collections[collection.id]);
  const stats = useMemo(() => {
    let checked = 0;
    for (const item of collection.items) {
      if (statusMap?.[item.id]) {
        checked++;
      }
    }
    return { total: collection.items.length, checked };
  }, [collection.items, statusMap]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-md font-semibold text-gray-800 sm:text-lg">{collection.name}</h2>
        <p className="text-sm text-gray-500">
          {t('collection.collected', { count: stats.checked, total: stats.total })}
        </p>
      </div>

      {/* Grid of cards */}
      <div className="p-4 2xl:px-8 2xl:pt-4 2xl:pb-6">
        <div
          className="mx-auto grid max-w-[480px] grid-cols-[repeat(var(--cols),minmax(0,1fr))]
            gap-[var(--gap)] [--cols:var(--cols-xs)] [--gap:calc(6*var(--spacing)/var(--cols))]
            md:max-w-[960px] md:[--cols:var(--cols-md)]
            md:[--gap:calc(18*var(--spacing)/var(--cols))] 2xl:max-w-[1600px]
            2xl:[--cols:var(--cols-2xl)] 2xl:[--gap:calc(36*var(--spacing)/var(--cols))]"
          style={
            {
              '--cols-xs': layout?.columns?.[0] ?? 3,
              '--cols-md': layout?.columns?.[1] ?? (layout?.columns?.[0] ?? 3) * 2,
              '--cols-2xl': layout?.columns?.[2] ?? (layout?.columns?.[0] ?? 3) * 3,
            } as React.CSSProperties
          }
        >
          {collection.items.map(item => (
            <ImageCheckCard
              key={`${collection.id}-${item.id}`}
              collectionId={collection.id}
              item={item}
              aspectRatio={layout?.aspectRatio}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
