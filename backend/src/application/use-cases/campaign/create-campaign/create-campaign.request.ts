import { object, string } from "yup";

export const createCampaignSchema = object({
  name: string().required().trim().min(2).max(120),
  description: string().required().trim().max(500),
});

export type CreateCampaignRequest = { name: string; description: string };
