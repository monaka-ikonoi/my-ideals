import { memo } from 'react';
import { type TemplateCollection } from '@/domain/template';
import { ImageCheckCard } from './ImageCheckCard';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

type CollectionGridProps = {
  collection: TemplateCollection;
  mode?: 'normal' | 'export';
};

export const CollectionGrid = memo(function CollectionGrid({
  collection,
  mode = 'normal',
}: CollectionGridProps) {
  debugLog.render.log(`CollectionGrid render: ${collection.id}`);

  const layout = collection.layout ?? useActiveProfileStore.getState().template?.layout;

  const colsXs = layout?.columns?.[0] ?? 3;
  const colsMd = layout?.columns?.[1] ?? colsXs * 2;
  const cols2xl = layout?.columns?.[2] ?? colsXs * 3;

  return (
    <div
      className={
        mode === 'export'
          ? `mx-auto grid max-w-[1600px] grid-cols-[repeat(var(--cols),minmax(0,1fr))]
            gap-[calc(36*var(--spacing)/var(--cols))]`
          : `mx-auto grid max-w-[480px] grid-cols-[repeat(var(--cols),minmax(0,1fr))]
            gap-[var(--gap)] [--cols:var(--cols-xs)] [--gap:calc(6*var(--spacing)/var(--cols))]
            md:max-w-[960px] md:[--cols:var(--cols-md)]
            md:[--gap:calc(18*var(--spacing)/var(--cols))] 2xl:max-w-[1600px]
            2xl:[--cols:var(--cols-2xl)] 2xl:[--gap:calc(36*var(--spacing)/var(--cols))]`
      }
      style={
        mode === 'export'
          ? ({
              '--cols': cols2xl,
            } as React.CSSProperties)
          : ({
              '--cols-xs': colsXs,
              '--cols-md': colsMd,
              '--cols-2xl': cols2xl,
            } as React.CSSProperties)
      }
    >
      {collection.items.map(item => (
        <ImageCheckCard
          key={`${collection.id}-${item.id}`}
          collectionId={collection.id}
          item={item}
          mode={mode}
          aspectRatio={layout?.aspectRatio}
        />
      ))}
    </div>
  );
});
