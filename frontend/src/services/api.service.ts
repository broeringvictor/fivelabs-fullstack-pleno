import api from "../api/axios";
import type { Campaign, Appraisal, AppraisalDetail, DashboardReport } from "../types/api";

export const campaignService = {
  async list(): Promise<Campaign[]> {
    const response = await api.get<Campaign[]>("/campaigns");
    return response.data;
  },

  async create(data: { name: string; description: string }): Promise<Campaign> {
    const response = await api.post<Campaign>("/campaigns", data);
    return response.data;
  },
};

export const appraisalService = {
  async trigger(): Promise<Appraisal> {
    const response = await api.post<Appraisal>("/appraisals");
    return response.data;
  },

  async list(): Promise<Appraisal[]> {
    const response = await api.get<Appraisal[]>("/appraisals");
    return response.data;
  },

  async getById(id: string): Promise<Appraisal> {
    const response = await api.get<Appraisal>(`/appraisals/${id}`);
    return response.data;
  },

  async getDetail(id: string): Promise<AppraisalDetail> {
    const response = await api.get<AppraisalDetail>(`/appraisals/${id}`);
    return response.data;
  },
};

export const reportService = {
  async getDashboard(): Promise<DashboardReport> {
    const response = await api.get<DashboardReport>("/reports/dashboard");
    return response.data;
  },
};
