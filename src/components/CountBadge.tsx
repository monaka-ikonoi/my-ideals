import { HeartIcon } from '@heroicons/react/24/solid';
import { type BadgePosition, type BadgeSize } from './CountBadgeProps';

export type BadgeProps = {
  position: BadgePosition;
  size: BadgeSize;
};

// Bottom bar is ~24px tall in export mode.
const BADGE_POSITION_CLASS: Record<BadgePosition, string> = {
  'top-left': 'top-1.5 left-1.5',
  'top-middle': 'top-1.5 left-1/2 -translate-x-1/2',
  'top-right': 'top-1.5 right-1.5',
  'bottom-left': 'bottom-7 left-1.5',
  'bottom-middle': 'bottom-7 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-7 right-1.5',
};

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
      paddingInline: cqw(spec.px),
      fontSize: cqw(spec.text),
      borderRadius: cqw(spec.rounded),
      gap: cqw(spec.gap),
    },
    icon: { height: cqw(spec.icon), width: cqw(spec.icon) },
  };
}

type CountBadgeProps = {
  count: number;
  props?: BadgeProps;
  rotated?: boolean;
};

export function CountBadge({
  count,
  props = { position: 'top-right', size: 'medium' },
  rotated,
}: CountBadgeProps) {
  // Rotated cards has their width doubled. The scaling factor ensures same badge size
  const sizeStyle = buildSizeStyle(BADGE_SIZE[props.size], rotated ? 0.5 : 1);
  return (
    <div
      className={`absolute z-10 flex transform-gpu items-center justify-center overflow-hidden
        border font-bold tabular-nums backface-hidden ${BADGE_POSITION_CLASS[props.position]} ${
          count > 0
            ? 'text-gray-80 border-gray-200/60 bg-white/80'
            : 'border-pink-200/60 bg-pink-100/80 text-pink-600'
        }`}
      style={sizeStyle.container}
    >
      {count > 0 ? (
        count
      ) : (
        <>
          <HeartIcon style={sizeStyle.icon} />
          {count !== -1 && <span className="leading-none">{Math.abs(count)}</span>}
        </>
      )}
    </div>
  );
}
