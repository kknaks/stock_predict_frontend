"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user";
import { accountService } from "@/services/account";
import { AccountType, UserRole } from "@/types/user";

interface AccountTypeOption {
  value: AccountType;
  label: string;
  description: string;
}

const ALL_ACCOUNT_TYPES: AccountTypeOption[] = [
  {
    value: "real",
    label: "실전",
    description: "한국투자증권 실계좌",
  },
  {
    value: "paper",
    label: "모의",
    description: "모의 거래 계좌",
  },
  {
    value: "mock",
    label: "테스트",
    description: "테스트용 계좌",
  },
];

const getAllowedAccountTypes = (role: UserRole): AccountTypeOption[] => {
  if (role === "mock" || role === "admin") {
    return ALL_ACCOUNT_TYPES;
  }
  return ALL_ACCOUNT_TYPES.filter((t) => t.value !== "mock");
};

export default function AccountCreatePage() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 폼 상태
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [htsId, setHtsId] = useState("");
  const [accountBalance, setAccountBalance] = useState<number>(10000000);

  // 인증 결과
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [verifiedBalance, setVerifiedBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await userService.getProfile();
        setRole(profile.role);
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로필 로딩 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 계좌 유형 변경 시 인증 상태 초기화
  useEffect(() => {
    setVerifyToken(null);
    setVerifiedBalance(null);
    setError("");
  }, [accountType]);

  const allowedTypes = role ? getAllowedAccountTypes(role) : [];
  const isMockAccount = accountType === "mock";
  const isVerified = verifyToken !== null;

  const handleVerify = async () => {
    if (!accountType || accountType === "mock") return;

    if (!accountNumber.trim()) {
      setError("계좌번호를 입력해주세요");
      return;
    }
    if (!htsId.trim()) {
      setError("HTS ID를 입력해주세요");
      return;
    }
    if (!appKey.trim()) {
      setError("App Key를 입력해주세요");
      return;
    }
    if (!appSecret.trim()) {
      setError("App Secret을 입력해주세요");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      const result = await accountService.verify({
        account_number: accountNumber,
        app_key: appKey,
        app_secret: appSecret,
        account_type: accountType,
        hts_id: htsId,
      });
      setVerifyToken(result.verify_token);
      setVerifiedBalance(result.account_balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증 실패");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!accountName.trim()) {
      setError("계좌 이름을 입력해주세요");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (isMockAccount) {
        await accountService.create({
          account_name: accountName,
          account_type: "mock",
          account_balance: accountBalance,
        });
      } else {
        if (!verifyToken) {
          setError("먼저 계좌 인증을 진행해주세요");
          setSaving(false);
          return;
        }
        await accountService.create({
          account_name: accountName,
          verify_token: verifyToken,
        });
      }
      router.push("/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const formatBalance = (value: number) => {
    return value.toLocaleString() + "원";
  };

  const canSave = () => {
    if (!accountType || !accountName.trim()) return false;
    if (isMockAccount) return true;
    return isVerified;
  };

  return (
    <div className="p-4 pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold">계좌 추가</h1>
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && role && (
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
          {/* 계좌 유형 선택 */}
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-3">계좌 유형</p>
            <div className="flex gap-2">
              {allowedTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAccountType(type.value)}
                  disabled={isVerified}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    accountType === type.value
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  } ${isVerified ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 계좌 이름 - 공통 */}
          {accountType && (
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
              <label className="text-xs text-gray-500 block mb-2">계좌 이름</label>
              <div className="relative">
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="예: 내 투자계좌"
                  className="w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {accountName && (
                  <button
                    type="button"
                    onClick={() => setAccountName("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MOCK 계좌 - 초기 잔액 */}
          {isMockAccount && (
            <>
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-gray-500">초기 잔액</label>
                  <span className="text-sm font-medium">{formatBalance(accountBalance)}</span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="100000000"
                  step="1000000"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>100만원</span>
                  <span>1억원</span>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500">
                  테스트 계좌는 실제 거래 없이 시뮬레이션으로 동작합니다.
                </p>
              </div>
            </>
          )}

          {/* REAL/PAPER 계좌 - 인증 정보 */}
          {!isMockAccount && accountType && (
            <>
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <label className="text-xs text-gray-500 block mb-2">계좌번호</label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="예: 12345678-01"
                    disabled={isVerified}
                    className={`w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isVerified ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {accountNumber && !isVerified && (
                    <button
                      type="button"
                      onClick={() => setAccountNumber("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <label className="text-xs text-gray-500 block mb-2">HTS ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={htsId}
                    onChange={(e) => setHtsId(e.target.value)}
                    placeholder="한국투자증권 HTS 계정"
                    disabled={isVerified}
                    className={`w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isVerified ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {htsId && !isVerified && (
                    <button
                      type="button"
                      onClick={() => setHtsId("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <label className="text-xs text-gray-500 block mb-2">App Key</label>
                <div className="relative">
                  <input
                    type="text"
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder="한국투자증권 App Key"
                    disabled={isVerified}
                    className={`w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isVerified ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {appKey && !isVerified && (
                    <button
                      type="button"
                      onClick={() => setAppKey("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <label className="text-xs text-gray-500 block mb-2">App Secret</label>
                <div className="relative">
                  <input
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="한국투자증권 App Secret"
                    disabled={isVerified}
                    className={`w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isVerified ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {appSecret && !isVerified && (
                    <button
                      type="button"
                      onClick={() => setAppSecret("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 인증 완료 표시 */}
              {isVerified && (
                <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                  <label className="text-xs text-gray-500 block mb-2">인증 상태</label>
                  <div className="w-full px-3 py-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">인증 완료</span>
                    </div>
                    <span className="text-sm font-bold text-green-700 dark:text-green-400">{formatBalance(verifiedBalance!)}</span>
                  </div>
                </div>
              )}

              {/* 인증 버튼 */}
              {!isVerified && (
                <div className="p-4">
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {verifying ? "인증 중..." : "인증하기"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* 버튼 - mock이거나 인증 완료 시 */}
          {(isMockAccount || isVerified) && (
            <div className="flex gap-3 p-4">
              <button
                onClick={() => {
                  if (isVerified) {
                    setVerifyToken(null);
                    setVerifiedBalance(null);
                  } else {
                    router.back();
                  }
                }}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                {isVerified ? "다시 입력" : "취소"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !canSave()}
                className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "등록 중..." : "등록"}
              </button>
            </div>
          )}

          {/* 취소 버튼 - 계좌 유형 선택 전 또는 인증 전 */}
          {!isMockAccount && !isVerified && (
            <div className="p-4 pt-0">
              <button
                onClick={() => router.back()}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
