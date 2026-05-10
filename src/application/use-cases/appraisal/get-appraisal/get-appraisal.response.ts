export type AppraisalResultItem = {
  goalId: string;
  salespersonId: string;
  achievedValue: string;
  achievedCurrency: string;
  goalMet: boolean;
  payableAmount: string;
  payableCurrency: string;
};

export type GetAppraisalResponse = {
  id: string;
  status: string;
  createdAt: string;
  finishedAt: string | null;
  results: AppraisalResultItem[];
};
