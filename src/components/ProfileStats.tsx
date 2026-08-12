import { useTranslation } from 'react-i18next';
import type { TemplateCollection } from '@/domain/template';
import { useActiveProfile } from '@/stores/profileSessionStore';
import { useTemplate } from '@/contexts/template';
import { getPrimaryField, isNumberField } from '@/domain/profile';
import { useAggregatedCollectionStats } from '@/hooks/useStats';

type ProfileStatsProps = {
  visibleCollections: TemplateCollection[];
  baseCollectionMap: Record<string, TemplateCollection>;
};

export function ProfileStats({ visibleCollections, baseCollectionMap }: ProfileStatsProps) {
  const { t } = useTranslation();

  const allCollections = useTemplate().collections;
  const globalStats = useAggregatedCollectionStats(allCollections);
  const currentStats = useAggregatedCollectionStats(visibleCollections, baseCollectionMap);

  const enableCount = useActiveProfile(state => isNumberField(getPrimaryField(state.fields)));

  const renderStatRow = (label: string, stats: typeof currentStats, isTotal?: boolean) => (
    <div
      className={`flex flex-wrap items-center justify-between gap-y-1 text-sm
        ${isTotal ? 'text-gray-500' : 'text-gray-600'} tabular-nums`}
    >
      <span className="min-w-[64px] font-medium">{label}</span>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{t('stats.collections', { count: stats.totalCollections })}</span>
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
