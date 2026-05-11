export type ListAppraisalsResponse = Array<{
  id: string;
  status: string;
  createdAt: string;
  finishedAt: string | null;
}>;
