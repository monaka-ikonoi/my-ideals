import type { ItemRecord, RecordFieldView } from '@/domain/profile';
import { useImageOptions } from '@/contexts/imageOptions';
import {
  getVisibleBadges,
  type BadgeMap,
  type BadgePosition,
  type VisibleBadge,
} from './BadgeProps';
import { ItemBadge } from './ItemBadge';
import { ItemBadgeGroup } from './ItemBadgeGroup';

function groupBadgesByPosition(
  fieldViews: RecordFieldView[],
  badges: BadgeMap,
  record: ItemRecord | undefined
): [BadgePosition, VisibleBadge[]][] {
  const groups = new Map<BadgePosition, VisibleBadge[]>();

  for (const badge of getVisibleBadges(fieldViews, badges, record)) {
    const group = groups.get(badge.config.position);
    if (group) group.push(badge);
    else groups.set(badge.config.position, [badge]);
  }

  return [...groups];
}

type ItemBadgeOverlayProps = {
  fieldViews: RecordFieldView[];
  record: ItemRecord | undefined;
  rotated?: boolean;
};

export function ItemBadgeOverlay({ fieldViews, record, rotated }: ItemBadgeOverlayProps) {
  const { badges, badgeArrangement } = useImageOptions();
  const groups = groupBadgesByPosition(fieldViews, badges, record);

  return groups.map(([position, group]) => (
    <ItemBadgeGroup
      key={position}
      position={position}
      arrangement={badgeArrangement}
      rotated={rotated}
    >
      {group.map(({ fieldView, value, config }) => (
        <ItemBadge
          key={fieldView.id}
          fieldView={fieldView}
          value={value}
          config={config}
          rotated={rotated}
        />
      ))}
    </ItemBadgeGroup>
  ));
}
