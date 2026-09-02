import type { RecordValue, RecordFieldView } from '@/domain/profile';
import { useTranslation } from 'react-i18next';
import {
  BADGE_VARIANT_PARTS,
  BADGE_ICONS,
  DEFAULT_BADGE_COLOR,
  DEFAULT_BADGE_ICON,
  resolveBadgeVariant,
  type BadgeProps,
  type BadgeColor,
  type BadgePosition,
  type BadgeSize,
} from './CountBadgeProps';
import { resolveFieldViewName } from '@/utils/recordUtils';
import { normalizeStatusNumber } from '@/utils/utils';

// Bottom bar is ~24px tall in export mode.
const BADGE_POSITION_CLASS: Record<BadgePosition, string> = {
  'top-left': 'top-1.5 left-1.5',
  'top-middle': 'top-1.5 left-1/2 -translate-x-1/2',
  'top-right': 'top-1.5 right-1.5',
  'bottom-left': 'bottom-7 left-1.5',
  'bottom-middle': 'bottom-7 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-7 right-1.5',
};

// Interpolated names are safelisted in src/index.css.
function badgeColorClass(color: BadgeColor = DEFAULT_BADGE_COLOR): string {
  return color === 'white'
    ? 'border-gray-200/60 bg-white/80 text-gray-800'
    : `border-${color}-200/60 bg-${color}-100/80 text-${color}-600`;
}

type SizeSpec = {
  h: number;
  px: number;
  text: number;
  rounded: number;
  gap: number;
  icon: number;
};

const BADGE_SIZE: Record<BadgeSize, SizeSpec> = {
  small: { h: 25, px: 5, text: 12.5, rounded: 5, gap: 3, icon: 12.5 },
  medium: { h: 33, px: 6.5, text: 16.5, rounded: 6.5, gap: 4, icon: 16.5 },
  large: { h: 40, px: 8, text: 20, rounded: 8, gap: 5, icon: 20 },
  xlarge: { h: 50, px: 10, text: 25, rounded: 10, gap: 6, icon: 25 },
};

function buildSizeStyle(
  spec: SizeSpec,
  scale: number
): { container: React.CSSProperties; icon: React.CSSProperties } {
  const cqw = (v: number) => `${v * scale}cqw`;
  return {
    container: {
      height: cqw(spec.h),
      minWidth: cqw(spec.h),
      maxWidth: cqw(80),
      paddingInline: cqw(spec.px),
      fontSize: cqw(spec.text),
      borderRadius: cqw(spec.rounded),
      gap: cqw(spec.gap),
    },
    icon: { height: cqw(spec.icon), width: cqw(spec.icon) },
  };
}

type ItemBadgeProps = {
  fieldView: RecordFieldView;
  value: RecordValue;
  config: BadgeProps;
  rotated?: boolean;
};

export function ItemBadge({ fieldView, value, config, rotated }: ItemBadgeProps) {
  const { t } = useTranslation();

  // Rotated cards has their width doubled. The scaling factor ensures same badge size
  const sizeStyle = buildSizeStyle(BADGE_SIZE[config.size], rotated ? 0.5 : 1);

  const parts = BADGE_VARIANT_PARTS[resolveBadgeVariant(config.variant, fieldView)];
  const Icon = BADGE_ICONS[config.icon ?? DEFAULT_BADGE_ICON];

  return (
    <div
      className={`absolute z-10 flex transform-gpu items-center justify-center overflow-hidden
        border font-bold tabular-nums backface-hidden ${BADGE_POSITION_CLASS[config.position]}
        ${badgeColorClass(config.color)}`}
      style={sizeStyle.container}
    >
      {parts.icon && <Icon className="shrink-0" style={sizeStyle.icon} />}
      {parts.text && (
        <span className="truncate">{resolveFieldViewName(t, fieldView).slice(0, 1)}</span>
      )}
      {parts.number && <span className="leading-none">{normalizeStatusNumber(value)}</span>}
    </div>
  );
}
