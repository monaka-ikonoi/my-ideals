import { memo, useMemo } from 'react';
import { type TemplateCollection } from '@/domain/template';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { type ImageOptions } from '@/stores/settingsStore';
import { debugLog } from '@/utils/debug';
import {
  computeGaps,
  resolveAspectRatio,
  resolveColumns,
  type ResolvedLayout,
} from '@/utils/layoutUtils';
import { ImageGrid } from './ImageGrid';

type CollectionGridProps = {
  collection: TemplateCollection;
  mode?: 'normal' | 'export' | 'edit';
  columns?: [number, number, number];
  imageOptions?: ImageOptions;
};

export const CollectionGrid = memo(function CollectionGrid({
  collection,
  mode = 'normal',
  columns,
  imageOptions,
}: CollectionGridProps) {
  debugLog.render.log(`CollectionGrid: ${collection.id}`);

  const statusMap = useActiveProfileStore(state => state.profile?.collections[collection.id]);

  const collectionLayout = collection.layout;
  const templateLayout = useActiveProfileStore(state => state.template?.layout);
  const computedLayout = useMemo<ResolvedLayout>(() => {
    const computedColumns = columns ? columns : resolveColumns(collectionLayout, templateLayout);
    return {
      aspectRatio: resolveAspectRatio(collectionLayout, templateLayout),
      columns: computedColumns,
      gaps: computeGaps(computedColumns),
    };
  }, [columns, collectionLayout, templateLayout]);

  return (
    <ImageGrid
      items={collection.items.map(item => ({
        collection: collection.id,
        item,
        status: statusMap?.[item.id],
      }))}
      layout={computedLayout}
      mode={mode}
      imageOptions={imageOptions}
    />
  );
});
