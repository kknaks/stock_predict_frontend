import { api } from "./api";
import { LoginRequest, TokenResponse } from "@/types/auth";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>("/api/v1/auth/login", data);
    this.setTokens(response);
    return response;
  },

  async refresh(): Promise<TokenResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await api.post<TokenResponse>("/api/v1/auth/refresh", {
        refresh_token: refreshToken,
      });
      this.setTokens(response);
      return response;
    } catch {
      this.clearTokens();
      return null;
    }
  },

  async logout(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      try {
        await api.post("/api/v1/auth/logout", {}, { token });
      } catch {
        // 무시
      }
    }
    this.clearTokens();
  },

  setTokens(tokens: TokenResponse): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    }
  },

  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_KEY);
    }
    return null;
  },

  clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
