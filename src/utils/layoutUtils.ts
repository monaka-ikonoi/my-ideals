import { type TemplateLayout } from '@/domain/template';

type LayoutTuple = [number, number, number];

export type ResolvedTemplateLayout = {
  aspectRatio: string;
  columns: LayoutTuple;
  gaps: LayoutTuple;
};

export function resolveColumns(
  collectionLayout?: TemplateLayout,
  templateLayout?: TemplateLayout
): LayoutTuple {
  const layoutColumns = collectionLayout?.columns ?? templateLayout?.columns;
  const base = layoutColumns?.[0] ?? 3;
  return [base, layoutColumns?.[1] ?? base * 2, layoutColumns?.[2] ?? base * 3];
}

export function resolveAspectRatio(
  collectionLayout?: TemplateLayout,
  templateLayout?: TemplateLayout
): string {
  return collectionLayout?.aspectRatio ?? templateLayout?.aspectRatio ?? '7/10';
}

/**
 * Resolve the "items per member" hint used to pad member groups with empty grid
 * cells. Returns `undefined` when no hint is configured (padding disabled).
 */
export function resolveGroupHint(
  collectionLayout?: TemplateLayout,
  templateLayout?: TemplateLayout
): number | undefined {
  return collectionLayout?.groupHint ?? templateLayout?.groupHint;
}

const GAP_UNIT = 4;
const GAP_FACTOR = [6, 18, 36];

export function computeGaps(columns: LayoutTuple): LayoutTuple {
  return columns.map((col, i) => (GAP_FACTOR[i] * GAP_UNIT) / col) as LayoutTuple;
}

export function resolveLayout(
  collectionLayout?: TemplateLayout,
  templateLayout?: TemplateLayout
): ResolvedTemplateLayout {
  return {
    aspectRatio: resolveAspectRatio(collectionLayout, templateLayout),
    columns: resolveColumns(collectionLayout, templateLayout),
    gaps: computeGaps(resolveColumns(collectionLayout, templateLayout)),
  };
}

function indexByWidth(width: number): number {
  if (width >= 1536) return 2; // 2xl
  if (width >= 768) return 1; // md
  return 0; // xs
}

export function computeColumn(containerWidth: number, layout: ResolvedTemplateLayout): number {
  const i = indexByWidth(containerWidth);
  return layout.columns[i];
}

export function computeItemWidth(
  containerWidth: number,
  layout: ResolvedTemplateLayout,
  rotated: boolean = false
): number {
  const i = indexByWidth(containerWidth);
  const cols = layout.columns[i];
  const gap = layout.gaps[i];
  const width = (containerWidth - gap * (cols - 1)) / cols;
  return rotated ? 2 * width + gap : width;
}
