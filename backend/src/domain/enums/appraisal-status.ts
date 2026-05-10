export const AppraisalStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  DONE: "DONE",
  FAILED: "FAILED",
} as const;

export type AppraisalStatus = (typeof AppraisalStatus)[keyof typeof AppraisalStatus];
