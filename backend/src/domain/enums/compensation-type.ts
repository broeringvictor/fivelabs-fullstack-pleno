export const CompensationType = {
  FIXED: "FIXED",
  PERCENTAGE: "PERCENTAGE",
} as const;

export type CompensationType = (typeof CompensationType)[keyof typeof CompensationType];
