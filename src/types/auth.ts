export interface LoginRequest {
  nickname: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  uid: number;
  nickname: string;
  role: string;
}
