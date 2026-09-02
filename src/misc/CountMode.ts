import { type RecordField, type RecordFieldView } from '@/domain/profile';
import { normalizeStatusNumber } from '@/utils/utils';
import { type BadgeMap, type BadgeProps } from '@/components/card/BadgeProps';

export const COUNT_MODE_OWNED_ID = '_owned';
export const COUNT_MODE_WANTED_ID = '_wanted';

// Count mode uses signedness to keep owned and wanted in a single number
export const countModeFieldViews = (field: RecordField): RecordFieldView[] => [
  {
    id: COUNT_MODE_OWNED_ID,
    name: COUNT_MODE_OWNED_ID, // placeholder, resolved by i18n
    source: field,
    primary: true,
    transform: v => Math.max(normalizeStatusNumber(v), 0),
  },
  {
    id: COUNT_MODE_WANTED_ID,
    name: COUNT_MODE_WANTED_ID,
    source: field,
    transform: v => Math.max(-normalizeStatusNumber(v), 0),
  },
];

const WANTED_BADGE_PROPS: Partial<BadgeProps> = {
  color: 'pink',
  variant: 'iconNumber',
  icon: 'heart',
};

export const countModeBadgeProps = (props: BadgeProps): BadgeMap => ({
  [COUNT_MODE_OWNED_ID]: props,
  [COUNT_MODE_WANTED_ID]: { ...props, ...WANTED_BADGE_PROPS },
});
