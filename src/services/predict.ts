import { api } from "./api";
import { authService } from "./auth";
import { PredictionItem } from "@/types/predict";

export const predictService = {
  async getList(date?: string): Promise<PredictionItem[]> {
    const token = authService.getAccessToken();
    const query = date ? `?date=${date}` : "";
    return api.get<PredictionItem[]>(`/api/v1/predict${query}`, { token: token || undefined });
  },
};
