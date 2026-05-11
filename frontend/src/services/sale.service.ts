import api from "../api/axios"; export const saleService = { async create(data: any): Promise<void> { await api.post("/sales", data); } };
