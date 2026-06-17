import { memo, useMemo, useSyncExternalStore } from 'react';
import { useShallow } from 'zustand/shallow';
import { type TemplateCollection, type TemplateCollectionItem } from '@/domain/template';
import { ImageCheckCard } from './ImageCheckCard';
import { debugLog } from '@/utils/debug';
import { useActiveProfileStore } from '@/stores/activeProfileStore';
import { type ImageOptions } from '@/stores/settingsStore';
import { ProfileFlags, profileHasFlag } from '@/domain/profile';
import {
  computeColumn,
  computeGaps,
  resolveAspectRatio,
  resolveColumns,
  resolveGroupHint,
  type ResolvedTemplateLayout,
} from '@/utils/layoutUtils';

export type GridCell = { type: 'item'; item: TemplateCollectionItem } | { type: 'padding' };

function memberKey(member: TemplateCollectionItem['member']): string {
  return Array.isArray(member) ? member.sort().join('+') : member;
}

/**
 * Build the ordered list of grid cells for a collection. When `hint` is a
 * positive number, each consecutive member group is padded with empty padding
 * cells. Rotated items count as two cells. The final group is not padded
 * (trailing gaps are pointless).
 *
 * The padding target ("unit") depends on the column count currently rendered:
 * - When `columns >= hint` (a row can hold whole groups), pad to a multiple of
 *   `hint` so several groups can share one wide row (e.g. 12 cols / hint 6 ->
 *   two groups per row).
 * - When `columns < hint` (a group spans multiple rows), pad to a multiple of
 *   `columns` so each group fills whole rows (e.g. 3 cols / hint 5 -> pad to 6).
 * Since `pad < unit <= columns`, a fully empty padding row can never occur.
 *
 * Items are assumed to already be grouped by member in document order, so this
 * only detects boundaries and never reorders.
 */
function buildCells(items: TemplateCollectionItem[], hint?: number, columns?: number): GridCell[] {
  if (!hint || hint < 1) {
    return items.map(item => ({ type: 'item', item }));
  }

  const unit = columns && columns >= 1 && columns < hint ? columns : hint;

  const cells: GridCell[] = [];
  let groupKey: string | undefined;
  let groupCells = 0;

  const flushGroup = () => {
    const pad = Math.ceil(groupCells / unit) * unit - groupCells;
    for (let i = 0; i < pad; i++) {
      cells.push({ type: 'padding' });
    }
  };

  for (const item of items) {
    const key = memberKey(item.member);
    if (groupKey !== undefined && key !== groupKey) {
      flushGroup();
      groupCells = 0;
    }
    groupKey = key;
    cells.push({ type: 'item', item });
    groupCells += item.rotated ? 2 : 1;
  }

  return cells;
}

/**
 * Tracks the column count active at the current viewport width via
 * `computeColumn`. The snapshot is the column number itself, so the store bails
 * out of re-rendering until the breakpoint actually changes the column count.
 */
function useActiveColumns(layout: ResolvedTemplateLayout): number {
  return useSyncExternalStore(
    cb => {
      window.addEventListener('resize', cb);
      return () => window.removeEventListener('resize', cb);
    },
    () => computeColumn(window.innerWidth, layout),
    () => layout.columns[0]
  );
}

type CollectionGridProps = {
  collection: TemplateCollection;
  mode?: 'normal' | 'export' | 'edit';
  columns?: [number, number, number];
  imageOptions?: ImageOptions;
  grouped?: boolean;
};

export const CollectionGrid = memo(function CollectionGrid({
  collection,
  mode = 'normal',
  columns,
  imageOptions,
  grouped = true,
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

  const resolvedLayout = useMemo<ResolvedTemplateLayout>(
    () => ({ aspectRatio: resolvedAspectRatio, columns: computedColumns, gaps: computedGaps }),
    [resolvedAspectRatio, computedColumns, computedGaps]
  );

  // Export renders a single fixed-width layout (2xl columns); otherwise follow the
  // active viewport so padding adapts to the currently visible row width.
  const viewportColumns = useActiveColumns(resolvedLayout);
  const activeColumns = mode === 'export' ? computedColumns[2] : viewportColumns;
  const cells = useMemo(
    () =>
      buildCells(
        collection.items,
        grouped ? resolveGroupHint(collectionLayout, templateLayout) : undefined,
        activeColumns
      ),
    [
      collection.items,
      grouped,
      collectionLayout?.groupHint,
      templateLayout?.groupHint,
      activeColumns,
    ]
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
      {cells.map((cell, cellIndex) => {
        if (cell.type === 'padding') {
          return <div key={`${collection.id}-pad-${cellIndex}`} aria-hidden="true" />;
        }
        const item = cell.item;
        return (
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
              imageOptions={imageOptions}
            />
          </div>
        );
      })}
    </div>
  );
});
