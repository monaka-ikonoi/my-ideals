import { useTranslation } from 'react-i18next';
import type { TemplateCollection } from '@/domain/template';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { useAggreatedCollectionStats } from '@/hooks/useStats';

type ProfileStatsProps = {
  filteredCollections: TemplateCollection[];
};

export function ProfileStats({ filteredCollections }: ProfileStatsProps) {
  const { t } = useTranslation();

  const allCollections = useActiveProfileStore(state => state.template?.collections) ?? [];
  const globalStats = useAggreatedCollectionStats(allCollections);
  const currentStats = useAggreatedCollectionStats(filteredCollections);

  const enableCount = useActiveProfileStore(state =>
    profileHasFlag(state.profile!, ProfileFlags.ENABLE_COUNT)
  );

  const renderStatRow = (label: string, stats: typeof currentStats, isTotal?: boolean) => (
    <div
      className={`flex flex-wrap items-center justify-between gap-y-1 text-sm
        ${isTotal ? 'text-gray-500' : 'text-gray-600'}`}
    >
      <span className="min-w-[64px] font-medium">{label}</span>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{t('stats.collections', { count: stats.totalCollections })}</span>
        <span>
          {t('stats.item-collected', {
            count: stats.collectedItems,
            total: stats.totalItems,
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
  );

  return (
    <div className="grid grid-cols-1 gap-y-2 lg:grid-cols-2 lg:gap-x-8">
      {renderStatRow(t('stats.global.view'), currentStats, false)}

      <div className="lg:border-l lg:border-gray-100 lg:pl-8">
        {renderStatRow(t('stats.global.total'), globalStats, true)}
      </div>
    </div>
  );
}
