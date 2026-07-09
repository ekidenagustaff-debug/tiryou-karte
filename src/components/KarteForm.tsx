"use client";

import { useState } from "react";
import { KarteFormData, NeedleTreatment, TreatmentScope } from "@/types/karte";

interface KarteFormProps {
  playerId: string;
  playerName: string;
  onSubmit: (data: KarteFormData) => Promise<void>;
}

const TRAINER_OPTIONS = ["吉見", "桑原", "吉田"];
const NEEDLE_OPTIONS: NeedleTreatment[] = ["あり", "なし"];
const SCOPE_OPTIONS: TreatmentScope[] = ["全身治療", "部分治療"];

const EMPTY = {
  trainerName: "",
  chiefComplaint: "",
  needleTreatment: "" as NeedleTreatment,
  needleLocation: "",
  treatmentScope: "" as TreatmentScope,
  overallAssessment: "",
};

export default function KarteForm({ playerId, playerName, onSubmit }: KarteFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trainerName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        playerId,
        clientName: playerName,
        ...form,
      });
      setForm(EMPTY);
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
      {/* 担当トレーナー名 */}
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

      {/* 主訴 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">主訴</label>
        <textarea
          name="chiefComplaint"
          value={form.chiefComplaint}
          onChange={handleChange}
          rows={3}
          placeholder="気になる症状や痛みの箇所、経緯など..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white resize-none"
        />
      </div>

      {/* 針治療の有無 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">針治療の有無</label>
        <select
          name="needleTreatment"
          value={form.needleTreatment}
          onChange={handleChange}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white text-gray-800"
        >
          <option value="">選択してください...</option>
          {NEEDLE_OPTIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* 針治療の箇所（あり選択時のみ表示） */}
      {form.needleTreatment === "あり" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">針治療の箇所</label>
          <textarea
            name="needleLocation"
            value={form.needleLocation}
            onChange={handleChange}
            rows={2}
            placeholder="施術箇所を記入..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white resize-none"
          />
        </div>
      )}

      {/* 治療範囲 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">治療範囲</label>
        <select
          name="treatmentScope"
          value={form.treatmentScope}
          onChange={handleChange}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white text-gray-800"
        >
          <option value="">選択してください...</option>
          {SCOPE_OPTIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* 総評 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">総評</label>
        <textarea
          name="overallAssessment"
          value={form.overallAssessment}
          onChange={handleChange}
          rows={3}
          placeholder="今回の施術の評価、次回へのメモなど..."
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
        {saving ? "保存中..." : "カルテを保存する"}
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
