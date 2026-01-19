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
}
