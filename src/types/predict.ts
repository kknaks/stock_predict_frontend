export interface PredictionItem {
  id: number;
  timestamp: string;
  stock_code: string;
  stock_name: string;
  exchange: string | null;
  prediction_date: string;
  gap_rate: number;
  stock_open: number;
  prob_up: number;
  prob_down: number;
  predicted_direction: number;
  expected_return: number;
  return_if_up: number;
  return_if_down: number;
  max_return_if_up: number | null;
  take_profit_target: number | null;
  signal: "BUY" | "HOLD" | "SELL";
  model_version: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  actual_close: number | null;
  actual_high: number | null;
  actual_low: number | null;
  actual_return: number | null;
  return_diff: number | null;
  actual_max_return: number | null;
  max_return_diff: number | null;
  direction_correct: number | null;
  current_price: number | null;
}

export interface StrategyInfo {
  id: number;
  name: string;
  description: string | null;
}

export interface StrategyPrediction {
  strategy_info: StrategyInfo;
  predictions: PredictionItem[];
}

export interface PredictListResponse {
  is_market_open: boolean;
  data: StrategyPrediction[];
}

export interface StockMetadata {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  listing_date: string | null;
  status: string;
  delist_date: string | null;
}

export interface PriceUpdate {
  timestamp: string;
  stock_code: string;
  trade_time: string;
  current_price: string;
  price_change_sign: string;
  price_change: string;
  price_change_rate: string;
  weighted_avg_price: string;
  open_price: string;
  high_price: string;
  low_price: string;
  ask_price1: string;
  bid_price1: string;
  trade_volume: string;
  accumulated_volume: string;
  accumulated_trade_amount: string;
  sell_trade_count: string;
  buy_trade_count: string;
  net_buy_trade_count: string;
  trade_strength: string;
  total_sell_trade_volume: string;
  total_buy_trade_volume: string;
  trade_type: string;
  buy_rate: string;
  volume_ratio: string;
  open_time: string;
  open_price_change_sign: string;
  open_price_change: string;
  high_time: string;
  high_price_change_sign: string;
  high_price_change: string;
  low_time: string;
  low_price_change_sign: string;
  low_price_change: string;
  business_date: string;
  new_market_open_code: string;
  trading_halt_yn: string;
  ask_remaining1: string;
  bid_remaining1: string;
  total_ask_remaining: string;
  total_bid_remaining: string;
  volume_turnover_rate: string;
  prev_same_time_volume: string;
  prev_same_time_volume_rate: string;
  time_class_code: string;
  market_trade_class_code: string;
  vi_standard_price: string;
}
