// 사용자 역할
export type UserRole = "admin" | "user" | "guest" | "mock";

// 계좌 유형
export type AccountType = "real" | "paper" | "mock";

// 계좌 정보
export interface AccountResponse {
  id: number;
  account_number: string;
  account_name: string;
  account_type: AccountType;
  account_balance: string;
  created_at: string;
  user_strategies: UserStrategyResponse[];
}

// 계좌 상세 정보
export interface AccountDetailResponse {
  id: number;
  account_number: string;
  account_name: string;
  account_type: AccountType;
  account_balance: string;
  hts_id: string;
  app_key: string;
  app_secret: string;
  created_at: string;
  user_strategies: UserStrategyResponse[];
}

// 전략 기본 정보
export interface StrategyInfo {
  id: number;
  name: string;
  description: string;
}

// 전략 비중 타입
export interface StrategyWeightType {
  id: number;
  weight_type: string;
  description: string;
}

// 사용자 전략 정보
export interface UserStrategyResponse {
  id: number;
  strategy_id: number;
  investment_weight: number;
  ls_ratio: number;
  tp_ratio: number;
  is_auto: boolean;
  status: string;
  strategy_info: StrategyInfo;
  strategy_weight_type: StrategyWeightType;
}

// 사용자 프로필 응답
export interface UserProfileResponse {
  uid: number;
  nickname: string;
  role: UserRole;
  accounts: AccountResponse[];
}
