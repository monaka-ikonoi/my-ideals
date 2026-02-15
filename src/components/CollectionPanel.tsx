import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type TemplateCollection } from '@/domain/template';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { CollectionGrid } from './CollectionGrid';

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
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-md font-semibold text-gray-800 sm:text-lg">{collection.name}</h2>
        <p className="text-sm text-gray-500">
          {t('collection.collected', { count: stats.checked, total: stats.total })}
        </p>
      </div>

      <div className="p-4 2xl:px-8 2xl:pt-4 2xl:pb-6">
        <CollectionGrid collection={collection} />
      </div>
    </div>
  );
});
