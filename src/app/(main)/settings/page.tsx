"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user";
import { authService } from "@/services/auth";
import { UserProfileResponse, AccountType } from "@/types/user";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userService.getProfile();
      setProfile(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로필 로딩 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "user":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "user":
        return "사용자";
      default:
        return "게스트";
    }
  };

  const getAccountTypeBadge = (type: AccountType) => {
    switch (type) {
      case "real":
        return {
          label: "실전",
          className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        };
      case "paper":
        return {
          label: "모의",
          className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        };
      case "mock":
        return {
          label: "테스트",
          className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        };
      default:
        return {
          label: type,
          className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        };
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return balance;
    return Math.floor(num).toLocaleString() + "원";
  };

  return (
    <div className="p-4 pb-20 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <h1 className="text-xl font-bold mb-6">설정</h1>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && profile && (
        <div className="space-y-6">
          {/* 기본정보 */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              기본정보
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">닉네임</span>
                <span className="font-medium">{profile.nickname}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-gray-500">권한</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(
                    profile.role
                  )}`}
                >
                  {getRoleLabel(profile.role)}
                </span>
              </div>
            </div>
          </section>

          {/* 계좌 및 전략 */}
          <section>
            <div className="flex justify-between items-center mb-2 px-1">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                계좌
              </h2>
              <button
                onClick={() => router.push("/settings/accounts/new")}
                className="text-xs text-blue-500 font-medium"
              >
                추가하기
              </button>
            </div>
            {profile.accounts.length > 0 ? (
              <div className="space-y-4">
                {profile.accounts.map((account) => {
                  const badge = getAccountTypeBadge(account.account_type);
                  return (
                    <div
                      key={account.id}
                      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden"
                    >
                      {/* 계좌 헤더 */}
                      <div
                        onClick={() =>
                          router.push(`/settings/accounts/${account.id}`)
                        }
                        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.account_name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {formatBalance(account.account_balance)}
                          </span>
                          <svg
                            className="w-5 h-5 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* 전략 목록 */}
                      <div className="bg-gray-50 dark:bg-gray-950/50 ml-4">
                        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-xs text-gray-400 font-medium">전략</span>
                          <button
                            onClick={() => router.push(`/settings/strategies/new?account_id=${account.id}`)}
                            className="text-xs text-blue-500 font-medium"
                          >
                            추가
                          </button>
                        </div>
                        {account.user_strategies.length > 0 ? (
                          <ul>
                            {account.user_strategies.map((strategy, idx) => (
                              <li
                                key={strategy.id}
                                onClick={() =>
                                  router.push(`/settings/strategies/${strategy.id}`)
                                }
                                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                                  idx !== account.user_strategies.length - 1
                                    ? "border-b border-gray-100 dark:border-gray-800"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">
                                    {strategy.strategy_info?.description ||
                                      strategy.strategy_info?.name ||
                                      `전략 ${idx + 1}`}
                                  </span>
                                  {strategy.status === "active" && (
                                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      활성
                                    </span>
                                  )}
                                  {strategy.is_auto && (
                                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                      자동
                                    </span>
                                  )}
                                </div>
                                <svg
                                  className="w-4 h-4 text-gray-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="px-4 py-4 text-center">
                            <p className="text-gray-400 text-xs">설정된 전략이 없습니다</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-6 text-center">
                  <p className="text-gray-400 text-sm">연동된 계좌가 없습니다</p>
                </div>
              </div>
            )}
          </section>

          {/* 로그아웃 버튼 */}
          <section className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 text-red-500 bg-white dark:bg-gray-900 rounded-xl font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              로그아웃
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
