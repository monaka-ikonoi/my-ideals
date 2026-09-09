import type { ItemRecord, RecordFieldView, RecordValue } from '@/domain/profile';
import { useImageOptions } from '@/contexts/imageOptions';
import { readRecordFieldView } from '@/utils/recordUtils';
import { type BadgeMap, type BadgePosition, type BadgeProps } from './BadgeProps';
import { ItemBadge } from './ItemBadge';
import { ItemBadgeGroup } from './ItemBadgeGroup';

type VisibleBadge = { fieldView: RecordFieldView; value: RecordValue; config: BadgeProps };

function groupBadgesByPosition(
  fieldViews: RecordFieldView[],
  badges: BadgeMap,
  record: ItemRecord | undefined
): [BadgePosition, VisibleBadge[]][] {
  const groups = new Map<BadgePosition, VisibleBadge[]>();

  for (const fieldView of fieldViews) {
    const config = badges[fieldView.id];
    if (!config) continue;

    const value = readRecordFieldView(record, fieldView);
    if (value === readRecordFieldView(undefined, fieldView)) continue;

    const group = groups.get(config.position);
    if (group) group.push({ fieldView, value, config });
    else groups.set(config.position, [{ fieldView, value, config }]);
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
