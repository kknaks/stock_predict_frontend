"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { userService } from "@/services/user";
import { strategyService } from "@/services/strategy";
import { UserStrategyResponse } from "@/types/user";

// 비중 타입 하드코딩
const WEIGHT_TYPES = [
  { id: 1, weight_type: "EQUAL", description: "동일 비중" },
  { id: 2, weight_type: "MARKETCAP", description: "시총 비중" },
  { id: 3, weight_type: "VOLUME", description: "거래량 비중" },
  { id: 4, weight_type: "PRICE", description: "가격 비중" },
];

export default function StrategyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [strategy, setStrategy] = useState<UserStrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 폼 상태
  const [investmentWeight, setInvestmentWeight] = useState(1);
  const [lsRatio, setLsRatio] = useState(-1);
  const [tpRatio, setTpRatio] = useState(0.8);
  const [isAuto, setIsAuto] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [weightTypeId, setWeightTypeId] = useState(1);

  useEffect(() => {
    const fetchStrategy = async () => {
      setLoading(true);
      setError("");
      try {
        const profile = await userService.getProfile();
        const found = profile.user_strategy.find((s) => s.id === id);
        if (found) {
          setStrategy(found);
          setInvestmentWeight(found.investment_weight);
          setLsRatio(found.ls_ratio);
          setTpRatio(found.tp_ratio);
          setIsAuto(found.is_auto);
          setIsActive(found.status === "active");
          setWeightTypeId(found.strategy_weight_type.id);
        } else {
          setError("전략을 찾을 수 없습니다");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchStrategy();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await strategyService.update(id, {
        investment_weight: investmentWeight,
        ls_ratio: lsRatio,
        tp_ratio: tpRatio,
        is_auto: isAuto,
        status: isActive ? "active" : "inactive",
        strategy_weight_type_id: weightTypeId,
      });
      router.push("/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 pb-20 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1"
        >
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
        <h1 className="text-xl font-bold">전략 설정</h1>
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && strategy && (
        <div className="space-y-4">
          {/* 전략 이름 (읽기 전용) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">전략</p>
            <p className="font-semibold text-lg">
              {strategy.strategy_info.description}
            </p>
          </div>

          {/* 비중 타입 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-2">비중 타입</p>
            <div className="grid grid-cols-2 gap-2">
              {WEIGHT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setWeightTypeId(type.id)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    weightTypeId === type.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {type.description}
                </button>
              ))}
            </div>
          </div>

          {/* 투자 비중 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-400">투자 비중</p>
              <p className="text-sm font-medium">{(investmentWeight * 100).toFixed(0)}%</p>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={investmentWeight}
              onChange={(e) => setInvestmentWeight(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* 손절 비율 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-400">손절 비율</p>
              <p className="text-sm font-medium text-blue-500">{lsRatio.toFixed(1)}%</p>
            </div>
            <input
              type="range"
              min="-100"
              max="0"
              step="1"
              value={lsRatio}
              onChange={(e) => setLsRatio(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* 익절 비율 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-400">익절 비율</p>
              <p className="text-sm font-medium text-red-500">+{(tpRatio * 100).toFixed(0)}%</p>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={tpRatio}
              onChange={(e) => setTpRatio(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* 토글들 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
            {/* 자동매매 */}
            <div className="flex justify-between items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <span className="font-medium">자동매매</span>
              <button
                onClick={() => setIsAuto(!isAuto)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  isAuto ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isAuto ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {/* 활성화 */}
            <div className="flex justify-between items-center px-4 py-3.5">
              <span className="font-medium">활성화</span>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  isActive ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 삭제/저장 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (confirm("정말 삭제하시겠습니까?")) {
                  try {
                    await strategyService.delete(id);
                    router.push("/settings");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "삭제 실패");
                  }
                }
              }}
              className="flex-1 py-3.5 bg-white dark:bg-gray-900 text-red-500 rounded-xl font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              삭제
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3.5 bg-blue-500 text-white rounded-xl font-medium shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
