// 일별 히스토리
export interface DailyHistory {
  date: string;
  profit_rate: number;
  profit_amount: number;
  cumulative_profit_rate: number;
  cumulative_profit_amount: number;
  buy_amount: number;
  sell_amount: number;
}

// 계좌별 히스토리
export interface AccountHistoryResponse {
  account_id: number;
  account_number: string;
  account_name: string;
  total_profit_rate: number;
  total_profit_amount: number;
  total_buy_amount: number;
  total_sell_amount: number;
  trading_days: number;
  daily_histories: DailyHistory[];
}

// 최종 응답
export interface HistoryResponse {
  year: number;
  month: number;
  accounts: AccountHistoryResponse[];
}
