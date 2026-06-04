import { type TemplateLayout } from '@/domain/template';

type LayoutTuple = [number, number, number];

type ResolvedTemplateLayout = {
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
