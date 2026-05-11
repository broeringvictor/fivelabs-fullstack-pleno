// frontend/src/lib/condition-builder.utils.ts
import type {
  ConditionGroupDraft,
  ConditionGroupInput,
  ConditionOperator,
} from '@/types/goal';

export function emptyGroup(): ConditionGroupDraft {
  return { _id: crypto.randomUUID(), logicalOperator: 'AND', conditions: [], children: [] };
}

export function draftToInput(group: ConditionGroupDraft): ConditionGroupInput {
  return {
    logicalOperator: group.logicalOperator,
    conditions: group.conditions.map((c) => ({
      field: c.field,
      operator: c.operator,
      value: parseRawValue(c.operator, c.rawValue),
    })),
    children: group.children.map(draftToInput),
  };
}

function parseRawValue(
  operator: ConditionOperator,
  raw: string,
): string | number | string[] {
  if (operator === 'IN' || operator === 'NOT_IN') {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const n = Number(raw);
  return raw.trim() === '' || isNaN(n) ? raw : n;
}
