"use client";

import { useState } from "react";
import { InBodyFormData } from "@/types/karte";

interface InBodyFormProps {
  playerId: string;
  playerName: string;
  onSubmit: (data: InBodyFormData) => Promise<void>;
}

const TRAINER_OPTIONS = ["吉見", "桑原", "吉田"];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY = {
  trainerName: "",
  weight: "",
  skeletalMuscleMass: "",
  bodyFatMass: "",
  bodyFatPercentage: "",
  bmi: "",
  visceralFatLevel: "",
  memo: "",
};

export default function InBodyForm({ playerId, playerName, onSubmit }: InBodyFormProps) {
  const [measuredDate, setMeasuredDate] = useState(todayStr());
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const toNumber = (raw: string): number | undefined => {
    if (raw.trim() === "") return undefined;
    const num = parseFloat(raw);
    return Number.isNaN(num) ? undefined : num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trainerName.trim() || !measuredDate) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        playerId,
        clientName: playerName,
        measuredDate,
        trainerName: form.trainerName,
        weight: toNumber(form.weight),
        skeletalMuscleMass: toNumber(form.skeletalMuscleMass),
        bodyFatMass: toNumber(form.bodyFatMass),
        bodyFatPercentage: toNumber(form.bodyFatPercentage),
        bmi: toNumber(form.bmi),
        visceralFatLevel: toNumber(form.visceralFatLevel),
        memo: form.memo,
      });
      setForm(EMPTY);
      setMeasuredDate(todayStr());
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
          測定日 <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={measuredDate}
          onChange={(e) => setMeasuredDate(e.target.value)}
          required
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white text-gray-800"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          担当トレーナー名 <span className="text-red-400">*</span>
        </label>
        <select
          name="trainerName"
          value={form.trainerName}
          onChange={handleChange}
          required
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white text-gray-800"
        >
          <option value="">トレーナーを選択...</option>
          {TRAINER_OPTIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">体重 (kg)</label>
          <input
            type="number"
            step="any"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">骨格筋量 (kg)</label>
          <input
            type="number"
            step="any"
            name="skeletalMuscleMass"
            value={form.skeletalMuscleMass}
            onChange={handleChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">体脂肪量 (kg)</label>
          <input
            type="number"
            step="any"
            name="bodyFatMass"
            value={form.bodyFatMass}
            onChange={handleChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">体脂肪率 (%)</label>
          <input
            type="number"
            step="any"
            name="bodyFatPercentage"
            value={form.bodyFatPercentage}
            onChange={handleChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">BMI</label>
          <input
            type="number"
            step="any"
            name="bmi"
            value={form.bmi}
            onChange={handleChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">内臓脂肪レベル</label>
          <input
            type="number"
            step="any"
            name="visceralFatLevel"
            value={form.visceralFatLevel}
            onChange={handleChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">メモ</label>
        <textarea
          name="memo"
          value={form.memo}
          onChange={handleChange}
          rows={3}
          placeholder="測定時の所見など..."
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
        {saving ? "保存中..." : "InBody記録を保存する"}
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
