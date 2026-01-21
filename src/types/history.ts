export interface DailyHistory {
  date: string;
  profit_rate: number;
  profit_amount: number;
  cumulative_profit_rate: number;
  cumulative_profit_amount: number;
  buy_amount: number;
  sell_amount: number;
}

export interface HistoryResponse {
  user_id: number;
  year: number;
  month: number;
  total_profit_rate: number;
  total_profit_amount: number;
  total_buy_amount: number;
  total_sell_amount: number;
  trading_days: number;
  daily_histories: DailyHistory[];
}
