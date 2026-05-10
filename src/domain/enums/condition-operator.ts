export const ConditionOperator = {
  EQ: "EQ",
  NEQ: "NEQ",
  GT: "GT",
  GTE: "GTE",
  LT: "LT",
  LTE: "LTE",
  IN: "IN",
  NOT_IN: "NOT_IN",
} as const;

export type ConditionOperator = (typeof ConditionOperator)[keyof typeof ConditionOperator];

export const scalarOperators = new Set<ConditionOperator>([
  "EQ", "NEQ", "GT", "GTE", "LT", "LTE",
]);

export const collectionOperators = new Set<ConditionOperator>([
  "IN", "NOT_IN",
]);
