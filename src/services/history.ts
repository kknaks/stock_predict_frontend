import { api } from "./api";
import { authService } from "./auth";
import { HistoryResponse } from "@/types/history";

export const historyService = {
  async getHistory(date?: string): Promise<HistoryResponse> {
    const token = authService.getAccessToken();
    const query = date ? `?date=${date}` : "";
    return api.get<HistoryResponse>(`/api/v1/history${query}`, { token: token || undefined });
  },
};
