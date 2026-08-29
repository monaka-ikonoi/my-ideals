export const BADGE_POSITIONS = [
  'top-left',
  'top-middle',
  'top-right',
  'bottom-left',
  'bottom-middle',
  'bottom-right',
] as const;
export type BadgePosition = (typeof BADGE_POSITIONS)[number];

export const BADGE_SIZES = ['small', 'medium', 'large', 'xlarge'] as const;
export type BadgeSize = (typeof BADGE_SIZES)[number];

/** `white` keeps the original neutral look; the rest are Tailwind palette names. */
export const BADGE_COLORS = [
  'white',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const;
export type BadgeColor = (typeof BADGE_COLORS)[number];

export type BadgeProps = {
  position: BadgePosition;
  size: BadgeSize;
  color?: BadgeColor;
};

export type BadgeMap = Record<string, BadgeProps>;

export const DEFAULT_BADGE_POSITION: BadgePosition = 'top-right';
export const DEFAULT_BADGE_SIZE: BadgeSize = 'medium';
export const DEFAULT_BADGE_COLOR: BadgeColor = 'white';
