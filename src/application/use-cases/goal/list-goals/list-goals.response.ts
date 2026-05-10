export type ListGoalsResponse = Array<{
  id: string;
  campaignId: string;
  name: string;
  validFrom: string;
  validTo: string;
  compensationType: string;
  compensationValue: string;
  compensationCurrency: string | null;
}>;
