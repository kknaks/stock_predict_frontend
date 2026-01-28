import { api } from "./api";
import { authService } from "./auth";
import { UserProfileResponse } from "@/types/user";

export const userService = {
  /**
   * 현재 로그인한 사용자 정보 조회
   */
  async getProfile(): Promise<UserProfileResponse> {
    const token = authService.getAccessToken();
    return api.get<UserProfileResponse>("/api/v1/users/me", {
      token: token || undefined,
    });
  },
};
