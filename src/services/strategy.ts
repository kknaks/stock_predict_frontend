import { api } from "./api";
import { authService } from "./auth";
import { StrategyInfo, StrategyWeightType } from "@/types/user";

export interface StrategyUpdateRequest {
  investment_weight: number;
  ls_ratio: number;
  tp_ratio: number;
  is_auto: boolean;
  status: string;
  strategy_weight_type_id: number;
}

export interface StrategyCreateRequest {
  strategy_id: number;
  investment_weight?: number;
  ls_ratio?: number;
  tp_ratio?: number;
  is_auto?: boolean;
  strategy_weight_type_id?: number;
}

export const strategyService = {
  async getStrategyInfoList(): Promise<StrategyInfo[]> {
    const token = authService.getAccessToken();
    return api.get<StrategyInfo[]>("/api/v1/strategy/info", {
      token: token || undefined,
    });
  },

  async getWeightTypes(): Promise<StrategyWeightType[]> {
    const token = authService.getAccessToken();
    return api.get<StrategyWeightType[]>("/api/v1/strategy/weight-types", {
      token: token || undefined,
    });
  },

  async create(data: StrategyCreateRequest): Promise<void> {
    const token = authService.getAccessToken();
    return api.post("/api/v1/strategy", data, {
      token: token || undefined,
    });
  },

  async update(id: number, data: Partial<StrategyUpdateRequest>): Promise<void> {
    const token = authService.getAccessToken();
    return api.patch(`/api/v1/strategy/${id}`, data, {
      token: token || undefined,
    });
  },

  async delete(id: number): Promise<void> {
    const token = authService.getAccessToken();
    return api.delete(`/api/v1/strategy/${id}`, {
      token: token || undefined,
    });
  },
};
