"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { strategyService } from "@/services/strategy";
import { StrategyInfo, StrategyWeightType } from "@/types/user";

export default function StrategyCreatePage() {
  const router = useRouter();

  const [strategyInfoList, setStrategyInfoList] = useState<StrategyInfo[]>([]);
  const [weightTypes, setWeightTypes] = useState<StrategyWeightType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 폼 상태
  const [strategyId, setStrategyId] = useState<number | null>(null);
  const [investmentWeight, setInvestmentWeight] = useState(0.9);
  const [lsRatio, setLsRatio] = useState(0);
  const [tpRatio, setTpRatio] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const [weightTypeId, setWeightTypeId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [infoList, types] = await Promise.all([
          strategyService.getStrategyInfoList(),
          strategyService.getWeightTypes(),
        ]);
        setStrategyInfoList(infoList);
        setWeightTypes(types);
        if (types.length > 0) {
          setWeightTypeId(types[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!strategyId) {
      setError("전략을 선택해주세요");
      return;
    }
    if (!weightTypeId) {
      setError("비중 타입을 선택해주세요");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await strategyService.create({
        strategy_id: strategyId,
        investment_weight: investmentWeight,
        ls_ratio: lsRatio,
        tp_ratio: tpRatio,
        is_auto: isAuto,
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
        <h1 className="text-xl font-bold">전략 추가</h1>
      </div>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && (
        <div className="space-y-4">
          {/* 전략 선택 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-2">전략 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {strategyInfoList.map((info) => (
                <button
                  key={info.id}
                  onClick={() => setStrategyId(info.id)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    strategyId === info.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {info.description}
                </button>
              ))}
            </div>
          </div>

          {/* 비중 타입 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-2">비중 타입</p>
            <div className="grid grid-cols-2 gap-2">
              {weightTypes.map((type) => (
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
              <p className="text-sm font-medium">
                {(investmentWeight * 100).toFixed(0)}%
              </p>
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
              <p className="text-sm font-medium text-blue-500">
                {lsRatio.toFixed(1)}%
              </p>
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
              <p className="text-sm font-medium text-red-500">
                +{(tpRatio * 100).toFixed(0)}%
              </p>
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

          {/* 자동매매 토글 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3.5">
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
          </div>

          {/* 취소/저장 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 py-3.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !strategyId}
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
