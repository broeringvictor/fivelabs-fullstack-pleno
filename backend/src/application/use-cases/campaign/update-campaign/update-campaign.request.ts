import { object, string } from "yup";

export const updateCampaignSchema = object({
  name: string().trim().min(2).max(120),
  description: string().trim().max(500),
});

export type UpdateCampaignRequest = { name?: string; description?: string };
