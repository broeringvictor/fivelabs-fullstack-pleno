export const LogicalOperator = {
  AND: "AND",
  OR: "OR",
} as const;

export type LogicalOperator = (typeof LogicalOperator)[keyof typeof LogicalOperator];
