import { type ItemRecord, type RecordField } from '@/domain/profile';
import { readField } from '@/utils/recordUtils';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';

export const NumberFilterOperators = ['gt', 'gte', 'eq', 'lte', 'lt'] as const;
type NumberFilterOperator = (typeof NumberFilterOperators)[number];

export type FieldCondition =
  | { fieldId: string; type: 'boolean'; value: boolean }
  | { fieldId: string; type: 'number'; op: NumberFilterOperator; value: number };

export type FilterNode = FieldCondition | FilterGroup;

export type FilterGroup = {
  type: 'group';
  operator: 'and' | 'or';
  children: FilterNode[];
};

export type FilterExpression = FilterGroup | null;

export type RecordPredicate = (record: ItemRecord | undefined) => boolean;

const compareNumber = (value: number, op: NumberFilterOperator, threshold: number): boolean => {
  switch (op) {
    case 'gt':
      return value > threshold;
    case 'gte':
      return value >= threshold;
    case 'eq':
      return value === threshold;
    case 'lte':
      return value <= threshold;
    case 'lt':
      return value < threshold;
  }
};

const buildConditionPredicate = (field: RecordField, condition: FieldCondition): RecordPredicate =>
  condition.type === 'boolean'
    ? record => normalizeStatusBoolean(readField(record, field)) === condition.value
    : record =>
        compareNumber(
          normalizeStatusNumber(readField(record, field)),
          condition.op,
          condition.value
        );

export function buildFilterPredicate(
  fields: RecordField[],
  expression: FilterExpression
): RecordPredicate | null {
  if (!expression) return null;

  const fieldsById = new Map(fields.map(field => [field.id, field]));

  const compile = (node: FilterNode): RecordPredicate | null => {
    if (node.type !== 'group') {
      const field = fieldsById.get(node.fieldId);
      return field ? buildConditionPredicate(field, node) : null;
    }

    const predicates = node.children
      .map(child => compile(child))
      .filter(predicate => predicate !== null);
    if (predicates.length === 0) return null;

    return node.operator === 'and'
      ? record => predicates.every(predicate => predicate(record))
      : record => predicates.some(predicate => predicate(record));
  };

  return compile(expression);
}

export function countFilterConditions(fields: RecordField[], expression: FilterExpression): number {
  if (!expression) return 0;

  const fieldIds = new Set(fields.map(field => field.id));
  const count = (node: FilterNode): number =>
    node.type === 'group'
      ? node.children.reduce((total, child) => total + count(child), 0)
      : Number(fieldIds.has(node.fieldId));

  return count(expression);
}
