import { api } from "./api";
import { authService } from "./auth";
import { TdPositionResponse } from "@/types/balance";

export const balanceService = {
  async getPosition(date?: string): Promise<TdPositionResponse> {
    const token = authService.getAccessToken();
    const query = date ? `?date=${date}` : "";
    return api.get<TdPositionResponse>(`/api/v1/td-position${query}`, { token: token || undefined });
  },
};
