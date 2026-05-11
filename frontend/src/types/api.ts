export interface Campaign {
  id: string;
  name: string;
  description: string;
  createdById: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  campaignId: string;
  name: string;
  validFrom: string;
  validTo: string;
  compensationType: "FIXED" | "PERCENTAGE";
  compensationValue: string;
  compensationCurrency: string | null;
}

export interface Appraisal {
  id: string;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  attempts: number;
  lastError: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface AppraisalResultItem {
  goalId: string;
  goalName: string;
  salespersonId: string;
  salespersonName: string;
  achievedValue: string;
  achievedCurrency: string;
  goalMet: boolean;
  payableAmount: string;
  payableCurrency: string;
}

export interface AppraisalDetail extends Appraisal {
  results: AppraisalResultItem[];
}

export interface DashboardReport {
  kpis: {
    totalCommissions: string;
    goalsMetPercentage: number;
    activeSalespersons: number;
    volumeProcessed: string;
    currency: string;
  };
  latestResults: Array<{
    id: string;
    salespersonName: string;
    goalName: string;
    status: "MET" | "NOT_MET";
    value: string;
    payable: string;
  }>;
  lastAppraisal: {
    id: string;
    status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
    lastError: string | null;
    updatedAt: string;
  } | null;
  isProcessing: boolean;
}
