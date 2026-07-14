import { type TemplateLayout } from '@/domain/template';

type LayoutTuple = [number, number, number];

export type ResolvedLayout = {
  aspectRatio: string;
  columns: LayoutTuple;
  gaps: LayoutTuple;
};

export function resolveColumns(primary?: TemplateLayout, secondary?: TemplateLayout): LayoutTuple {
  const layoutColumns = primary?.columns ?? secondary?.columns;
  const base = layoutColumns?.[0] ?? 3;
  return [base, layoutColumns?.[1] ?? base * 2, layoutColumns?.[2] ?? base * 3];
}

export function resolveAspectRatio(primary?: TemplateLayout, secondary?: TemplateLayout): string {
  return primary?.aspectRatio ?? secondary?.aspectRatio ?? '7/10';
}

const GAP_UNIT = 4;
const GAP_FACTOR = [6, 18, 36];

export function computeGaps(columns: LayoutTuple): LayoutTuple {
  return columns.map((col, i) => (GAP_FACTOR[i] * GAP_UNIT) / col) as LayoutTuple;
}

export function resolveLayout(
  primary?: TemplateLayout,
  secondary?: TemplateLayout
): ResolvedLayout {
  return {
    aspectRatio: resolveAspectRatio(primary, secondary),
    columns: resolveColumns(primary, secondary),
    gaps: computeGaps(resolveColumns(primary, secondary)),
  };
}

function indexByWidth(width: number): number {
  if (width >= 1536) return 2; // 2xl
  if (width >= 768) return 1; // md
  return 0; // xs
}

export function computeItemWidth(
  containerWidth: number,
  layout: ResolvedLayout,
  rotated: boolean = false
): number {
  const i = indexByWidth(containerWidth);
  const cols = layout.columns[i];
  const gap = layout.gaps[i];
  const width = (containerWidth - gap * (cols - 1)) / cols;
  return rotated ? 2 * width + gap : width;
}
