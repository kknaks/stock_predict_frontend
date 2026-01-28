import { api } from "./api";
import { authService } from "./auth";

export interface SellOrderRequest {
  daily_strategy_id: number;
  stock_code: string;
  order_type: "LIMIT" | "MARKET";
  order_price: number;
  order_quantity: number;
}

export interface SellOrderResponse {
  success: boolean;
  message?: string;
  order_id?: number;
}

export const orderService = {
  async sell(request: SellOrderRequest): Promise<SellOrderResponse> {
    const token = authService.getAccessToken() || undefined;
    return api.post<SellOrderResponse>("/api/v1/order/sell", request, { token });
  },
};
