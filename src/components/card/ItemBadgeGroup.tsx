import type { BadgeArrangement, BadgePosition } from './BadgeProps';

// Bottom bar is ~24px tall in export mode.
const POSITION_CLASS: Record<BadgePosition, string> = {
  'top-left': 'top-1.5 left-1.5',
  'top-middle': 'top-1.5 left-1/2 -translate-x-1/2',
  'top-right': 'top-1.5 right-1.5',
  'bottom-left': 'bottom-7 left-1.5',
  'bottom-middle': 'bottom-7 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-7 right-1.5',
};

// Badges stack inward from the edge the group is anchored to.
function calculateFlexProps(position: BadgePosition, arrangement: BadgeArrangement): string {
  if (arrangement === 'horizontal') {
    const row = position.endsWith('right') ? 'flex-row-reverse' : 'flex-row';
    const align = position.startsWith('bottom') ? 'items-end' : 'items-start';
    return `${row} ${align}`;
  }

  const stack = position.startsWith('bottom') ? 'flex-col-reverse' : 'flex-col';
  if (position.endsWith('left')) return `${stack} items-start`;
  if (position.endsWith('right')) return `${stack} items-end`;
  return `${stack} items-center`;
}

type ItemBadgeGroupProps = {
  position: BadgePosition;
  arrangement: BadgeArrangement;
  rotated?: boolean;
  children: React.ReactNode;
};

export function ItemBadgeGroup({ position, arrangement, rotated, children }: ItemBadgeGroupProps) {
  return (
    <div
      className={`absolute z-10 flex ${POSITION_CLASS[position]} ${calculateFlexProps( position,
        arrangement )}`}
      // Rotated cards have their width doubled
      style={{ gap: `${4 * (rotated ? 0.5 : 1)}cqw` }}
    >
      {children}
    </div>
  );
}
