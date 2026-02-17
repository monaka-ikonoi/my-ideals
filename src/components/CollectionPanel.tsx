import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { type TemplateCollection } from '@/domain/template';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useCollectionStats } from '@/hooks/useStats';
import { ProfileFlags, profileHasFlag } from '@/domain/profile/flags';
import { CollectionGrid } from './CollectionGrid';
import { CollectionImageButton } from './CollectionImageButton';

type CollectionPanelProps = {
  collection: TemplateCollection;
};

export const CollectionPanel = memo(function CollectionPanel({ collection }: CollectionPanelProps) {
  debugLog.render.log(`CollectionPanel render: ${collection.id}`);

  const { t } = useTranslation();

  const stats = useCollectionStats(collection);

  const enableCount = useActiveProfileStore(state =>
    profileHasFlag(state.profile!, ProfileFlags.ENABLE_COUNT)
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-md font-semibold text-gray-800 sm:text-lg">{collection.name}</h2>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
              <span>
                {t('stats.item-collected', {
                  count: stats.collectedItems,
                  total: stats.totalItems,
                })}
              </span>
              <span>
                {t('stats.member-completed', {
                  count: stats.completedMembers,
                  total: stats.totalMembers,
                })}
              </span>
              {enableCount && (
                <span>
                  {t('stats.owned', {
                    items: stats.ownedItems,
                    comps: stats.ownedComps,
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <CollectionImageButton collection={collection} />
          </div>
        </div>
      </div>

      <div className="p-4 2xl:px-8 2xl:pt-4 2xl:pb-6">
        <CollectionGrid collection={collection} />
      </div>
    </div>
  );
});
