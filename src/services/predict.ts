import { api } from "./api";
import { authService } from "./auth";
import { PredictListResponse } from "@/types/predict";

export const predictService = {
  async getList(date?: string): Promise<PredictListResponse> {
    const token = authService.getAccessToken();
    const query = date ? `?date=${date}` : "";
    return api.get<PredictListResponse>(`/api/v1/predict${query}`, { token: token || undefined });
  },
};
