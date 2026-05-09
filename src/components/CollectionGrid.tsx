import { memo, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { type TemplateCollection } from '@/domain/template';
import { ImageCheckCard } from './ImageCheckCard';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';

type CollectionGridProps = {
  collection: TemplateCollection;
  mode?: 'normal' | 'export' | 'edit';
  columns?: [number, number, number];
};

export const CollectionGrid = memo(function CollectionGrid({
  collection,
  mode = 'normal',
  columns,
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
    const layoutColumns = collectionLayout?.columns ?? templateLayout?.columns;
    const base = layoutColumns?.[0] ?? 3;
    return [base, layoutColumns?.[1] ?? base * 2, layoutColumns?.[2] ?? base * 3];
  }, [columns, collectionLayout?.columns, templateLayout?.columns]);

  return (
    <div
      className={
        mode === 'export'
          ? `mx-auto grid max-w-[1600px] grid-cols-[repeat(var(--cols),minmax(0,1fr))] items-start
            gap-[calc(36*var(--spacing)/var(--cols))]`
          : `mx-auto grid max-w-[480px] grid-cols-[repeat(var(--cols),minmax(0,1fr))] items-start
            gap-[var(--gap)] [--cols:var(--cols-xs)] [--gap:calc(6*var(--spacing)/var(--cols))]
            md:max-w-[960px] md:[--cols:var(--cols-md)]
            md:[--gap:calc(18*var(--spacing)/var(--cols))] 2xl:max-w-[1600px]
            2xl:[--cols:var(--cols-2xl)] 2xl:[--gap:calc(36*var(--spacing)/var(--cols))]`
      }
      style={
        mode === 'export'
          ? ({
              '--cols': computedColumns[2],
            } as React.CSSProperties)
          : ({
              '--cols-xs': computedColumns[0],
              '--cols-md': computedColumns[1],
              '--cols-2xl': computedColumns[2],
            } as React.CSSProperties)
      }
    >
      {collection.items.map(item => (
        <ImageCheckCard
          key={`${collection.id}-${item.id}`}
          collectionId={collection.id}
          item={item}
          mode={mode}
          aspectRatio={collectionLayout?.aspectRatio ?? templateLayout?.aspectRatio}
          enableCount={enableCount}
          imageBaseUrl={imageBaseUrl}
          revision={revision}
          status={statusMap?.[item.id]}
        />
      ))}
    </div>
  );
});
