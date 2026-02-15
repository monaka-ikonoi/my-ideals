import { memo } from 'react';
import { type TemplateCollection } from '@/domain/template';
import { ImageCheckCard } from './ImageCheckCard';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';

type CollectionGridProps = {
  collection: TemplateCollection;
};

export const CollectionGrid = memo(function CollectionGrid({ collection }: CollectionGridProps) {
  debugLog.render.log(`CollectionGrid render: ${collection.id}`);

  const layout = collection.layout ?? useActiveProfileStore.getState().template?.layout;

  return (
    <div
      className="mx-auto grid max-w-[480px] grid-cols-[repeat(var(--cols),minmax(0,1fr))]
        gap-[var(--gap)] [--cols:var(--cols-xs)] [--gap:calc(6*var(--spacing)/var(--cols))]
        md:max-w-[960px] md:[--cols:var(--cols-md)] md:[--gap:calc(18*var(--spacing)/var(--cols))]
        2xl:max-w-[1600px] 2xl:[--cols:var(--cols-2xl)]
        2xl:[--gap:calc(36*var(--spacing)/var(--cols))]"
      style={
        {
          '--cols-xs': layout?.columns?.[0] ?? 3,
          '--cols-md': layout?.columns?.[1] ?? (layout?.columns?.[0] ?? 3) * 2,
          '--cols-2xl': layout?.columns?.[2] ?? (layout?.columns?.[0] ?? 3) * 3,
        } as React.CSSProperties
      }
    >
      {collection.items.map(item => (
        <ImageCheckCard
          key={`${collection.id}-${item.id}`}
          collectionId={collection.id}
          item={item}
          aspectRatio={layout?.aspectRatio}
        />
      ))}
    </div>
  );
});
