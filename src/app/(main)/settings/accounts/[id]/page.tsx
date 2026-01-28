"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { accountService } from "@/services/account";
import { AccountDetailResponse, AccountType } from "@/types/user";

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = Number(params.id);

  const [account, setAccount] = useState<AccountDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  // 폼 상태
  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [htsId, setHtsId] = useState("");
  const [appKey, setAppKey] = useState("");
  const [appSecret, setAppSecret] = useState("");

  // 원본 인증 정보 (변경 감지용)
  const [originalHtsId, setOriginalHtsId] = useState("");
  const [originalAppKey, setOriginalAppKey] = useState("");

  // 인증 결과
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [verifiedBalance, setVerifiedBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await accountService.get(accountId);
        setAccount(data);
        setAccountName(data.account_name);
        setAccountBalance(Number(data.account_balance));
        setHtsId(data.hts_id);
        setAppKey(data.app_key);
        setAppSecret("");
        setOriginalHtsId(data.hts_id);
        setOriginalAppKey(data.app_key);
      } catch (err) {
        setError(err instanceof Error ? err.message : "계좌 정보 로딩 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [accountId]);

  const isMockAccount = account?.account_type === "mock";

  // 인증 정보 변경 여부
  const isAuthChanged = !isMockAccount && (
    htsId !== originalHtsId ||
    appKey !== originalAppKey ||
    appSecret !== ""
  );

  // 인증 필요 여부 (인증 정보 변경됐는데 아직 인증 안함)
  const needsVerification = isAuthChanged && !verifyToken;

  const handleVerify = async () => {
    if (!account) return;

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
        account_number: account.account_number,
        app_key: appKey,
        app_secret: appSecret,
        account_type: account.account_type,
        hts_id: htsId,
        exclude_account_id: account.id,
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
    if (!account) return;

    if (!accountName.trim()) {
      setError("계좌 이름을 입력해주세요");
      return;
    }

    if (needsVerification) {
      setError("인증 정보가 변경되었습니다. 먼저 인증을 진행해주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (isMockAccount) {
        await accountService.update(accountId, {
          account_name: accountName,
          account_balance: accountBalance,
        });
      } else if (verifyToken) {
        await accountService.update(accountId, {
          account_name: accountName,
          verify_token: verifyToken,
        });
      } else {
        await accountService.update(accountId, {
          account_name: accountName,
        });
      }
      router.push("/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 계좌를 삭제하시겠습니까?")) return;

    try {
      await accountService.delete(accountId);
      router.push("/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  const formatBalance = (value: number) => {
    return value.toLocaleString() + "원";
  };

  const getAccountTypeBadge = (type: AccountType) => {
    switch (type) {
      case "real":
        return { label: "실전", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
      case "paper":
        return { label: "모의", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
      case "mock":
        return { label: "테스트", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    }
  };

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-4 pb-20">
        <p className="text-red-500">{error || "계좌를 찾을 수 없습니다"}</p>
      </div>
    );
  }

  const badge = getAccountTypeBadge(account.account_type);

  return (
    <div className="p-4 pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">계좌 상세</h1>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
        {/* 계좌번호 (읽기 전용) */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <label className="text-xs text-gray-500 block mb-2">계좌번호</label>
          <div className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm opacity-60">
            {account.account_number}
          </div>
        </div>

        {/* 계좌 이름 */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <label className="text-xs text-gray-500 block mb-2">계좌 이름</label>
          <div className="relative">
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
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

        {/* MOCK: 잔액 */}
        {isMockAccount && (
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-500">잔액</label>
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
        )}

        {/* REAL/PAPER: 인증 정보 */}
        {!isMockAccount && (
          <>
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
              <label className="text-xs text-gray-500 block mb-2">HTS ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={htsId}
                  onChange={(e) => {
                    setHtsId(e.target.value);
                    setVerifyToken(null);
                  }}
                  className="w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {htsId && (
                  <button
                    type="button"
                    onClick={() => { setHtsId(""); setVerifyToken(null); }}
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
                  onChange={(e) => {
                    setAppKey(e.target.value);
                    setVerifyToken(null);
                  }}
                  className="w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {appKey && (
                  <button
                    type="button"
                    onClick={() => { setAppKey(""); setVerifyToken(null); }}
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
              <label className="text-xs text-gray-500 block mb-2">
                App Secret
                <span className="text-gray-400 ml-1">(변경 시에만 입력)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => {
                    setAppSecret(e.target.value);
                    setVerifyToken(null);
                  }}
                  placeholder="변경하려면 새 값 입력"
                  className="w-full px-3 py-2.5 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {appSecret && (
                  <button
                    type="button"
                    onClick={() => { setAppSecret(""); setVerifyToken(null); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* 인증 필요 표시 */}
            {needsVerification && (
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {verifying ? "인증 중..." : "인증하기"}
                </button>
              </div>
            )}

            {/* 인증 완료 표시 */}
            {verifyToken && (
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
          </>
        )}

        {/* 연관 전략 */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs text-gray-500">연관 전략</label>
            <button
              onClick={() => router.push(`/settings/strategies/new?account_id=${account.id}`)}
              className="text-xs text-blue-500 font-medium"
            >
              추가
            </button>
          </div>
          {account.user_strategies.length > 0 ? (
            <div className="space-y-2">
              {account.user_strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => router.push(`/settings/strategies/${strategy.id}`)}
                  className="w-full px-3 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {strategy.strategy_info?.description || strategy.strategy_info?.name}
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
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full px-3 py-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
              <p className="text-sm text-gray-400">설정된 전략이 없습니다</p>
            </div>
          )}
        </div>

        {/* 저장/삭제 버튼 */}
        <div className="flex gap-3 p-4">
          <button
            onClick={handleDelete}
            className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg font-medium transition-colors"
          >
            삭제
          </button>
          <button
            onClick={handleSave}
            disabled={saving || needsVerification}
            className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
