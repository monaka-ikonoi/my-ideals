import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { type TemplateCollection } from '@/domain/template';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { useCollectionStats } from '@/hooks/useStats';
import { ProfileFlags, profileHasFlag } from '@/domain/profile/flags';
import { CollectionGrid } from './CollectionGrid';
import { CollectionImageButton } from './CollectionImageButton';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { useDialogStore } from '@/stores/dialogStore';

type CollectionPanelProps = {
  collection: TemplateCollection;
  baseCollection: TemplateCollection;
};

export const CollectionPanel = memo(function CollectionPanel({
  collection,
  baseCollection,
}: CollectionPanelProps) {
  debugLog.render.log(`CollectionPanel render: ${collection.id}`);

  const { t } = useTranslation();

  const stats = useCollectionStats(collection, baseCollection);

  const enableCount = useActiveProfileStore(state =>
    profileHasFlag(state.profile!, ProfileFlags.ENABLE_COUNT)
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-md font-semibold text-gray-800 sm:text-lg">{collection.name}</h2>

            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500
                tabular-nums"
            >
              <span>
                {t('stats.collected', {
                  item: stats.items.collected,
                  totalItem: stats.items.total,
                  comp: stats.comps.collected,
                  totalComp: stats.comps.total,
                })}
              </span>
              {enableCount && (
                <span>
                  {t('stats.owned', {
                    items: stats.items.owned,
                    comps: stats.comps.owned,
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {enableCount && (
              <button
                type="button"
                onClick={() => useDialogStore.getState().openEditCollection(collection.id)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400
                  transition-colors hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            )}
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
