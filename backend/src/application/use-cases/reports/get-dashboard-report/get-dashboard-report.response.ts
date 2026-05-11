export type DashboardReportResponse = {
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
    status: string;
    lastError: string | null;
    updatedAt: string;
  } | null;
  isProcessing: boolean;
};
