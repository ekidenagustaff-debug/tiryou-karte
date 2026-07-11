"use client";

import { useState } from "react";
import { BloodTestFormData } from "@/types/karte";
import { BLOOD_TEST_CATEGORIES } from "@/lib/bloodTestItems";

interface BloodTestFormProps {
  playerId: string;
  playerName: string;
  playerGender?: string;
  onSubmit: (data: BloodTestFormData) => Promise<void>;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BloodTestForm({ playerId, playerName, playerGender, onSubmit }: BloodTestFormProps) {
  const [testDate, setTestDate] = useState(todayStr());
  const [memo, setMemo] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleCategories = BLOOD_TEST_CATEGORIES.filter(
    (c) => playerGender !== "男子" || c.items.some((i) => !i.femaleOnly)
  );

  const handleValueChange = (key: string, raw: string) => {
    setValues((prev) => ({ ...prev, [key]: raw }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testDate) return;
    setSaving(true);
    setError(null);
    try {
      const parsedValues: Record<string, number> = {};
      for (const [key, raw] of Object.entries(values)) {
        const num = parseFloat(raw);
        if (raw.trim() !== "" && !Number.isNaN(num)) parsedValues[key] = num;
      }
      await onSubmit({
        playerId,
        clientName: playerName,
        testDate,
        memo,
        values: parsedValues,
      });
      setValues({});
      setMemo("");
      setTestDate(todayStr());
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 h-full">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          採血日 <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={testDate}
          onChange={(e) => setTestDate(e.target.value)}
          required
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white text-gray-800"
        />
      </div>

      {visibleCategories.map((cat) => (
        <details key={cat.category} className="border border-gray-200 rounded-lg group" open={cat.category === "貧血関連項目"}>
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg group-open:rounded-b-none">
            {cat.category}
          </summary>
          <div className="grid grid-cols-2 gap-3 p-3">
            {cat.items.map((item) => (
              <div key={item.key} className="flex flex-col gap-0.5">
                <label className="text-[11px] text-gray-500 truncate" title={item.memo}>
                  {item.key}
                  {item.unit && <span className="text-gray-400"> ({item.unit})</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={values[item.key] ?? ""}
                  onChange={(e) => handleValueChange(item.key, e.target.value)}
                  placeholder="—"
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
                />
              </div>
            ))}
          </div>
        </details>
      ))}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">メモ</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="採血時の所見、体調など..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-auto bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm shadow-sm flex items-center justify-center gap-2"
      >
        {saving && (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {saving ? "保存中..." : "血液検査結果を保存する"}
      </button>

      {submitted && (
        <p className="text-center text-sm text-green-600 font-medium -mt-2">✓ Notionに保存しました</p>
      )}
      {error && (
        <p className="text-center text-sm text-red-500 font-medium -mt-2">{error}</p>
      )}
    </form>
  );
}
