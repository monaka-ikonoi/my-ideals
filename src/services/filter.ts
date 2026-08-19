import { type ItemRecord, type RecordField } from '@/domain/profile';
import { readField } from '@/utils/recordUtils';
import { normalizeStatusBoolean, normalizeStatusNumber } from '@/utils/utils';

export const NumberFilterOperators = ['gt', 'gte', 'eq', 'lte', 'lt'] as const;
type NumberFilterOperator = (typeof NumberFilterOperators)[number];

export type FieldCondition =
  | { fieldId: string; type: 'boolean'; value: boolean }
  | { fieldId: string; type: 'number'; op: NumberFilterOperator; value: number };

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

export function buildConditionsPredicate(
  fields: RecordField[],
  conditions: FieldCondition[]
): RecordPredicate | null {
  const predicates = conditions.flatMap(condition => {
    const field = fields.find(candidate => candidate.id === condition.fieldId);
    return field ? [buildConditionPredicate(field, condition)] : [];
  });

  if (predicates.length === 0) return null;

  return record => predicates.every(predicate => predicate(record));
}
