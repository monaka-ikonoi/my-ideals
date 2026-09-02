import type { ComponentProps, ComponentType } from 'react';
import {
  BookmarkIcon,
  CheckCircleIcon,
  FlagIcon,
  HeartIcon,
  StarIcon,
  LockClosedIcon,
  LockOpenIcon,
  QuestionMarkCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { RecordFieldView } from '@/domain/profile';

const POSITIONS = [
  'top-left',
  'top-middle',
  'top-right',
  'bottom-left',
  'bottom-middle',
  'bottom-right',
] as const;
export type BadgePosition = (typeof POSITIONS)[number];

const SIZES = ['small', 'medium', 'large', 'xlarge'] as const;
export type BadgeSize = (typeof SIZES)[number];

/** `white` keeps the original neutral look; the rest are Tailwind palette names. */
const COLORS = [
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
export type BadgeColor = (typeof COLORS)[number];

const VARIANTS = ['number', 'text', 'icon', 'textNumber', 'iconNumber'] as const;
export type BadgeVariant = (typeof VARIANTS)[number];

const VARIANT_PARTS: Record<BadgeVariant, { icon: boolean; text: boolean; number: boolean }> = {
  number: { icon: false, text: false, number: true },
  text: { icon: false, text: true, number: false },
  icon: { icon: true, text: false, number: false },
  textNumber: { icon: false, text: true, number: true },
  iconNumber: { icon: true, text: false, number: true },
};

const ICON_IDS = [
  'heart',
  'star',
  'check',
  'cross',
  'question',
  'bookmark',
  'flag',
  'locked',
  'unlocked',
] as const;
export type BadgeIcon = (typeof ICON_IDS)[number];

const ICONS: Record<BadgeIcon, ComponentType<ComponentProps<'svg'>>> = {
  heart: HeartIcon,
  star: StarIcon,
  check: CheckCircleIcon,
  cross: XCircleIcon,
  question: QuestionMarkCircleIcon,
  bookmark: BookmarkIcon,
  flag: FlagIcon,
  locked: LockClosedIcon,
  unlocked: LockOpenIcon,
};

export type BadgeProps = {
  position: BadgePosition;
  size: BadgeSize;
  color?: BadgeColor;
  variant?: BadgeVariant;
  icon?: BadgeIcon;
};

export type BadgeMap = Record<string, BadgeProps>;

const DEFAULTS: Required<Omit<BadgeProps, 'variant'>> = {
  position: 'top-right',
  size: 'medium',
  color: 'white',
  icon: 'heart',
};

export const BADGE_PROPS = {
  positions: POSITIONS,
  sizes: SIZES,
  colors: COLORS,
  variants: VARIANTS,
  variantParts: VARIANT_PARTS,
  iconIds: ICON_IDS,
  icons: ICONS,
  defaults: DEFAULTS,
};

export const resolveBadgeVariant = (
  content: BadgeVariant | undefined,
  fieldView: RecordFieldView
): BadgeVariant => content ?? (fieldView.source.type === 'number' ? 'number' : 'text');
