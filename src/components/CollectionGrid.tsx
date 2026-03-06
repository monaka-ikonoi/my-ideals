import { memo } from 'react';
import { type TemplateCollection } from '@/domain/template';
import { ImageCheckCard } from './ImageCheckCard';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

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

  const layout = collection.layout ?? useActiveProfileStore.getState().template?.layout;

  if (!columns) {
    const base = layout?.columns?.[0] ?? 3;
    columns = [base, layout?.columns?.[1] ?? base * 2, layout?.columns?.[2] ?? base * 3];
  }

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
              '--cols': columns[2],
            } as React.CSSProperties)
          : ({
              '--cols-xs': columns[0],
              '--cols-md': columns[1],
              '--cols-2xl': columns[2],
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
