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

export const BADGE_VARIANTS = ['number', 'text', 'icon', 'textNumber', 'iconNumber'] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

export const BADGE_VARIANT_PARTS: Record<
  BadgeVariant,
  { icon: boolean; text: boolean; number: boolean }
> = {
  number: { icon: false, text: false, number: true },
  text: { icon: false, text: true, number: false },
  icon: { icon: true, text: false, number: false },
  textNumber: { icon: false, text: true, number: true },
  iconNumber: { icon: true, text: false, number: true },
};

export const BADGE_ICON_IDS = [
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
export type BadgeIcon = (typeof BADGE_ICON_IDS)[number];

export const BADGE_ICONS: Record<BadgeIcon, ComponentType<ComponentProps<'svg'>>> = {
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

export const DEFAULT_BADGE_POSITION: BadgePosition = 'top-right';
export const DEFAULT_BADGE_SIZE: BadgeSize = 'medium';
export const DEFAULT_BADGE_COLOR: BadgeColor = 'white';
export const DEFAULT_BADGE_ICON: BadgeIcon = 'heart';

export const resolveBadgeVariant = (
  content: BadgeVariant | undefined,
  fieldView: RecordFieldView
): BadgeVariant => content ?? (fieldView.source.type === 'number' ? 'number' : 'text');
