import { nanoid } from 'nanoid';
import type { RecordField } from '@/domain/profile';
import type { FieldCondition, FilterExpression, FilterGroup, FilterNode } from '@/services/filter';

type NumberFilterOperator = Extract<FieldCondition, { type: 'number' }>['op'];

/** Keep both input values when the selected field changes type. */
export type ConditionDraft = {
  kind: 'condition';
  key: string;
  fieldId: string;
  op: NumberFilterOperator;
  value: number;
  checked: boolean;
};

export type GroupDraft = {
  kind: 'group';
  key: string;
  operator: FilterGroup['operator'];
  children: FilterDraftNode[];
};

export type FilterDraftNode = ConditionDraft | GroupDraft;

const isNonEmptyDraftNode = (node: FilterDraftNode | null): node is FilterDraftNode =>
  node !== null && (node.kind === 'condition' || node.children.length > 0);

export const FILTER_GROUP_MAX_DEPTH = 4;

export function getDraftGroupHeight(group: GroupDraft): number {
  let height = 1;
  for (const child of group.children) {
    if (child.kind === 'group') height = Math.max(height, 1 + getDraftGroupHeight(child));
  }
  return height;
}

export const createConditionDraft = (fieldId: string): ConditionDraft => ({
  kind: 'condition',
  key: nanoid(),
  fieldId,
  op: 'gt',
  value: 0,
  checked: true,
});

export const createGroupDraft = (
  operator: FilterGroup['operator'] = 'and',
  children: FilterDraftNode[] = []
): GroupDraft => ({
  kind: 'group',
  key: nanoid(),
  operator,
  children,
});

export function toFilterDraft(expression: FilterExpression): GroupDraft {
  if (!expression) return createGroupDraft();
  const children = expression.children
    .map(node =>
      node.type === 'group'
        ? toFilterDraft(node)
        : {
            ...createConditionDraft(node.fieldId),
            ...(node.type === 'number'
              ? { op: node.op, value: node.value }
              : { checked: node.value }),
          }
    )
    .filter(isNonEmptyDraftNode);
  return createGroupDraft(expression.operator, children);
}

export function parseFilterDraft(draft: GroupDraft, fields: RecordField[]): FilterExpression {
  const fieldsById = new Map(fields.map(field => [field.id, field]));

  const parseGroup = (group: GroupDraft): FilterGroup | null => {
    const children = group.children.flatMap<FilterNode>(node => {
      if (node.kind === 'group') {
        const parsed = parseGroup(node);
        return parsed ? [parsed] : [];
      }
      const field = fieldsById.get(node.fieldId);
      if (!field) return [];
      return field.type === 'number'
        ? [{ fieldId: field.id, type: 'number', op: node.op, value: node.value }]
        : [{ fieldId: field.id, type: 'boolean', value: node.checked }];
    });

    return children.length > 0 ? { type: 'group', operator: group.operator, children } : null;
  };

  return parseGroup(draft);
}

/** Each editor owns its direct children; null and empty groups are removed. */
export function updateDraftChild(
  group: GroupDraft,
  key: string,
  update: (node: FilterDraftNode) => FilterDraftNode | null
): GroupDraft {
  return {
    ...group,
    children: group.children
      .map(node => (node.key === key ? update(node) : node))
      .filter(isNonEmptyDraftNode),
  };
}
