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
        <h2 className="text-lg font-semibold text-gray-800">{collection.name}</h2>
        <p className="text-sm text-gray-500">
          {t('collection.collected', { count: stats.checked, total: stats.total })}
        </p>
      </div>

      {/* Grid of cards */}
      <div className="p-4">
        <div
          className="mx-auto grid max-w-[360px] grid-cols-3 gap-2 lg:max-w-[960px] lg:grid-cols-6
            lg:gap-4"
        >
          {collection.items.map(item => (
            <ImageCheckCard
              key={`${collection.id}-${item.id}`}
              collectionId={collection.id}
              item={item}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
