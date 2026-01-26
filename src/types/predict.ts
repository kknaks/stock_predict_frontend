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

// 분봉 캔들 데이터
export interface MinuteCandle {
  candle_date: string;
  candle_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count?: number;
}

export interface MinuteCandleResponse {
  stock_code: string;
  date: string | null;
  source: "cache" | "database" | "none";
  count: number;
  candles: MinuteCandle[];
}

// 시간봉 캔들 데이터
export interface HourCandle {
  candle_date: string;
  hour: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trade_count: number;
}

export interface HourCandleResponse {
  stock_code: string;
  date: string | null;
  source: "cache" | "database" | "none";
  count: number;
  candles: HourCandle[];
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

// 호가 데이터
export interface AskingPriceUpdate {
  timestamp: string;
  stock_code: string;
  business_hour: string;
  hour_cls_code: string;

  // 매도호가 1~10
  askp1: string;
  askp2: string;
  askp3: string;
  askp4: string;
  askp5: string;
  askp6: string;
  askp7: string;
  askp8: string;
  askp9: string;
  askp10: string;

  // 매수호가 1~10
  bidp1: string;
  bidp2: string;
  bidp3: string;
  bidp4: string;
  bidp5: string;
  bidp6: string;
  bidp7: string;
  bidp8: string;
  bidp9: string;
  bidp10: string;

  // 매도호가잔량 1~10
  askp_rsqn1: string;
  askp_rsqn2: string;
  askp_rsqn3: string;
  askp_rsqn4: string;
  askp_rsqn5: string;
  askp_rsqn6: string;
  askp_rsqn7: string;
  askp_rsqn8: string;
  askp_rsqn9: string;
  askp_rsqn10: string;

  // 매수호가잔량 1~10
  bidp_rsqn1: string;
  bidp_rsqn2: string;
  bidp_rsqn3: string;
  bidp_rsqn4: string;
  bidp_rsqn5: string;
  bidp_rsqn6: string;
  bidp_rsqn7: string;
  bidp_rsqn8: string;
  bidp_rsqn9: string;
  bidp_rsqn10: string;

  // 총 잔량
  total_askp_rsqn: string;
  total_bidp_rsqn: string;
  ovtm_total_askp_rsqn: string;
  ovtm_total_bidp_rsqn: string;

  // 예상체결 정보
  antc_cnpr: string;
  antc_cnqn: string;
  antc_vol: string;
  antc_cntg_vrss: string;
  antc_cntg_vrss_sign: string;
  antc_cntg_prdy_ctrt: string;

  // 기타
  acml_vol: string;
  total_askp_rsqn_icdc: string;
  total_bidp_rsqn_icdc: string;
  ovtm_total_askp_icdc: string;
  ovtm_total_bidp_icdc: string;
  stck_deal_cls_code: string;
}
