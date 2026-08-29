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

export type BadgeProps = {
  position: BadgePosition;
  size: BadgeSize;
};

export type BadgeMap = Record<string, BadgeProps>;

export const DEFAULT_BADGE_POSITION: BadgePosition = 'top-right';
export const DEFAULT_BADGE_SIZE: BadgeSize = 'medium';
