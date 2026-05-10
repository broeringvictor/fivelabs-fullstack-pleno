export const ConditionField = {
  TOTAL_VALUE: "TOTAL_VALUE",
  REGION: "REGION",
  PRODUCT: "PRODUCT",
  SALESPERSON: "SALESPERSON",
} as const;

export type ConditionField = (typeof ConditionField)[keyof typeof ConditionField];
