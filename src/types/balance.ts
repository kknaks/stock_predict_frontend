export type PositionStatus = "holding" | "target_reached" | "stop_loss" | "sold" | "not_purchased";

export interface StockPosition {
  stock_code: string;
  stock_name: string;
  buy_price: number | null;
  buy_quantity: number | null;
  buy_amount: number | null;
  sell_price: number | null;
  sell_quantity: number | null;
  sell_amount: number | null;
  holding_quantity: number;
  current_price: number | null;
  eval_amount: number | null;
  target_price: number | null;
  stop_loss_price: number | null;
  profit_rate: number | null;
  profit_amount: number | null;
  status: PositionStatus;
  order_count: number;
  last_order_at: string | null;
}

export interface TdPositionSummary {
  realized_profit_amount: number;
  holding_buy_amount: number;
  holding_eval_amount: number;
  holding_profit_amount: number;
  holding_profit_rate: number;
  total_holding_count: number;
  total_sold_count: number;
  total_target_reached_count: number;
  total_stop_loss_count: number;
}

// 계좌별 포지션 데이터
export interface AccountPosition {
  account_id: number;
  account_number: string;
  account_name: string;
  daily_strategy_id: number | null;
  summary: TdPositionSummary;
  positions: StockPosition[];
  updated_at: string | null;
}

// 응답 전체
export interface TdPositionResponse {
  date: string;
  accounts: AccountPosition[];
}
