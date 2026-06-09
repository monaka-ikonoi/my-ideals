import { memo, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { type TemplateCollection } from '@/domain/template';
import { ImageCheckCard } from './ImageCheckCard';
import { type BadgeProps } from './CountBadge';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { computeGaps, resolveAspectRatio, resolveColumns } from '@/utils/layoutUtils';

type CollectionGridProps = {
  collection: TemplateCollection;
  mode?: 'normal' | 'export' | 'edit';
  columns?: [number, number, number];
  badgeProps?: BadgeProps;
};

export const CollectionGrid = memo(function CollectionGrid({
  collection,
  mode = 'normal',
  columns,
  badgeProps,
}: CollectionGridProps) {
  debugLog.render.log(`CollectionGrid render: ${collection.id}`);

  const collectionLayout = collection.layout;
  const { templateLayout, enableCount, imageBaseUrl, revision } = useActiveProfileStore(
    useShallow(state => ({
      templateLayout: state.template?.layout,
      enableCount: state.profile ? profileHasFlag(state.profile, ProfileFlags.ENABLE_COUNT) : false,
      imageBaseUrl: state.template?.imageBaseUrl,
      revision: state.template?.revision,
    }))
  );

  const statusMap = useActiveProfileStore(state => state.profile?.collections[collection.id]);

  const computedColumns = useMemo<[number, number, number]>(() => {
    if (columns) return columns;
    return resolveColumns(collectionLayout, templateLayout);
  }, [columns, collectionLayout?.columns, templateLayout?.columns]);

  const computedGaps = useMemo(() => computeGaps(computedColumns), [computedColumns]);

  const resolvedAspectRatio = useMemo(
    () => resolveAspectRatio(collectionLayout, templateLayout),
    [collectionLayout?.aspectRatio, templateLayout?.aspectRatio]
  );

  /* To make rotated item height = (column width) * (h/w), its width need to be height * (h/w).
  /* Column wideth is (100% - gap) / 2.
   */
  const rotatedWidthFactor = useMemo(() => {
    const [w, h] = resolvedAspectRatio.split('/').map(Number);
    return (h / w) ** 2 / 2;
  }, [resolvedAspectRatio]);

  return (
    <div
      className={
        mode === 'export'
          ? `mx-auto grid max-w-[1600px] grid-cols-[repeat(var(--cols),minmax(0,1fr))] items-start
            gap-[var(--gap)]`
          : `mx-auto grid max-w-[480px] grid-cols-[repeat(var(--cols),minmax(0,1fr))] items-start
            gap-[var(--gap)] [--cols:var(--cols-xs)] [--gap:var(--gap-xs)] md:max-w-[960px]
            md:[--cols:var(--cols-md)] md:[--gap:var(--gap-md)] 2xl:max-w-[1600px]
            2xl:[--cols:var(--cols-2xl)] 2xl:[--gap:var(--gap-2xl)]`
      }
      style={
        mode === 'export'
          ? ({
              '--cols': computedColumns[2],
              '--gap': `${computedGaps[2]}px`,
            } as React.CSSProperties)
          : ({
              '--cols-xs': computedColumns[0],
              '--cols-md': computedColumns[1],
              '--cols-2xl': computedColumns[2],
              '--gap-xs': `${computedGaps[0]}px`,
              '--gap-md': `${computedGaps[1]}px`,
              '--gap-2xl': `${computedGaps[2]}px`,
            } as React.CSSProperties)
      }
    >
      {collection.items.map(item => (
        <div
          key={`${collection.id}-${item.id}`}
          className={item.rotated ? 'col-span-2 justify-self-center' : undefined}
          style={
            item.rotated
              ? // Limit the computed width of rotated items to 100% to avoid overflow.
                { width: `min(calc((100% - var(--gap)) * ${rotatedWidthFactor}), 100%)` }
              : undefined
          }
        >
          <ImageCheckCard
            collectionId={collection.id}
            item={item}
            mode={mode}
            aspectRatio={resolvedAspectRatio}
            enableCount={enableCount}
            imageBaseUrl={imageBaseUrl}
            revision={revision}
            status={statusMap?.[item.id]}
            badgeProps={badgeProps}
          />
        </div>
      ))}
    </div>
  );
});
