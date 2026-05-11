// frontend/src/services/goal.service.ts
import api from '../api/axios';
import type { Goal, CreateGoalRequest } from '../types/goal';

export const goalService = {
  async list(campaignId: string): Promise<Goal[]> {
    const response = await api.get<Goal[]>('/goals', { params: { campaignId } });
    return response.data;
  },

  async create(data: CreateGoalRequest): Promise<Goal> {
    const response = await api.post<Goal>('/goals', data);
    return response.data;
  },
};
