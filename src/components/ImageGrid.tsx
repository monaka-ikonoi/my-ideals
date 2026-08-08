import { memo, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { type TemplateCollectionItem } from '@/domain/template';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import { useActiveProfile } from '@/stores/profileSessionStore';
import { debugLog } from '@/utils/debug';
import { type ResolvedLayout } from '@/utils/layoutUtils';
import { ImageCheckCard } from './ImageCheckCard';

type ImageGridItem = {
  collection: string;
  item: TemplateCollectionItem;
  status: boolean | number | undefined;
};

type ImageGridProps = {
  items: ImageGridItem[];
  layout: ResolvedLayout;
  mode?: 'normal' | 'export' | 'edit';
};

export const ImageGrid = memo(function ImageGrid({
  items,
  layout,
  mode = 'normal',
}: ImageGridProps) {
  debugLog.render.log(`ImageGrid: ${items.length} items`);

  const { enableCount, imageBaseUrl, revision } = useActiveProfile(
    useShallow(state => ({
      enableCount: profileHasFlag(state.profile, ProfileFlags.ENABLE_COUNT),
      imageBaseUrl: state.template.imageBaseUrl,
      revision: state.template.revision,
    }))
  );

  /* To make rotated item height = (column width) * (h/w), its width need to be height * (h/w).
  /* Column wideth is (100% - gap) / 2.
   */
  const rotatedWidthFactor = useMemo(() => {
    const [w, h] = layout.aspectRatio.split('/').map(Number);
    return (h / w) ** 2 / 2;
  }, [layout.aspectRatio]);

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
              '--cols': layout.columns[2],
              '--gap': `${layout.gaps[2]}px`,
            } as React.CSSProperties)
          : ({
              '--cols-xs': layout.columns[0],
              '--cols-md': layout.columns[1],
              '--cols-2xl': layout.columns[2],
              '--gap-xs': `${layout.gaps[0]}px`,
              '--gap-md': `${layout.gaps[1]}px`,
              '--gap-2xl': `${layout.gaps[2]}px`,
            } as React.CSSProperties)
      }
    >
      {items.map(({ collection, item, status }) => (
        <div
          key={`${collection}|${item.id}`}
          className={item.rotated ? 'col-span-2 justify-self-center' : undefined}
          style={
            item.rotated
              ? // Limit the computed width of rotated items to 100% to avoid overflow.
                { width: `min(calc((100% - var(--gap)) * ${rotatedWidthFactor}), 100%)` }
              : undefined
          }
        >
          <ImageCheckCard
            collectionId={collection}
            item={item}
            mode={mode}
            aspectRatio={layout.aspectRatio}
            enableCount={enableCount}
            imageBaseUrl={imageBaseUrl}
            revision={revision}
            status={status}
          />
        </div>
      ))}
    </div>
  );
});
