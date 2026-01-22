import { api } from "./api";
import { authService } from "./auth";
import { AccountResponse, AccountDetailResponse, AccountType } from "@/types/user";

export interface VerifyAccountRequest {
  account_number: string;
  app_key: string;
  app_secret: string;
  account_type: AccountType;
  hts_id: string;
  exclude_account_id?: number;
}

export interface VerifyAccountResponse {
  verify_token: string;
  account_balance: number;
}

export interface CreateAccountRequest {
  account_name: string;
  verify_token?: string;
  account_type?: AccountType;
  account_balance?: number;
}

export interface UpdateAccountRequest {
  account_name?: string;
  account_balance?: number;
  verify_token?: string;
}

export const accountService = {
  async verify(data: VerifyAccountRequest): Promise<VerifyAccountResponse> {
    const token = authService.getAccessToken();
    return api.post<VerifyAccountResponse>("/api/v1/users/accounts/verify", data, {
      token: token || undefined,
    });
  },

  async create(data: CreateAccountRequest): Promise<AccountResponse> {
    const token = authService.getAccessToken();
    return api.post<AccountResponse>("/api/v1/users/accounts", data, {
      token: token || undefined,
    });
  },

  async get(accountId: number): Promise<AccountDetailResponse> {
    const token = authService.getAccessToken();
    return api.get<AccountDetailResponse>(`/api/v1/users/accounts/${accountId}`, {
      token: token || undefined,
    });
  },

  async update(accountId: number, data: UpdateAccountRequest): Promise<AccountResponse> {
    const token = authService.getAccessToken();
    return api.patch<AccountResponse>(`/api/v1/users/accounts/${accountId}`, data, {
      token: token || undefined,
    });
  },

  async delete(accountId: number): Promise<void> {
    const token = authService.getAccessToken();
    return api.delete<void>(`/api/v1/users/accounts/${accountId}`, {
      token: token || undefined,
    });
  },
};
