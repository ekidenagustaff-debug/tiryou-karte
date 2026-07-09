"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KarteRecord, PlayerInfo } from "@/types/karte";

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function formatRelativeDate(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  return `${diffDays}日前`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
}

const GRADE_ORDER = ["1年", "2年", "3年", "4年"];

export default function PlayerListPage() {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recentKartes, setRecentKartes] = useState<KarteRecord[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPlayers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    fetch("/api/karte/recent")
      .then((r) => r.ok ? r.json() : [])
      .then(setRecentKartes)
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  }, []);

  const grouped = players.reduce<Record<string, PlayerInfo[]>>((acc, p) => {
    const key = p.grade ?? "その他";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const grades = [
    ...GRADE_ORDER.filter((g) => grouped[g]),
    ...Object.keys(grouped).filter((g) => !GRADE_ORDER.includes(g)),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
        <div>
          <h1 className="text-base font-bold text-gray-800 leading-tight">SPM メディカルカルテ</h1>
          <p className="text-xs text-gray-400">青山学院陸上部</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex flex-col md:flex-row md:gap-8 md:items-start">
        {/* 選手一覧 — PC:左, スマホ:上 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">選手一覧</h2>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : error ? (
            <p className="text-sm text-red-400 text-center py-8">選手一覧の読み込みに失敗しました</p>
          ) : players.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">選手データが見つかりません</p>
          ) : (
            <div className="flex flex-col gap-6 md:grid md:grid-cols-4 md:gap-4 md:items-start">
              {grades.map((grade) => (
                <div key={grade}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{grade}</p>
                  <div className="flex flex-col gap-2">
                    {grouped[grade].map((player) => (
                      <Link
                        key={player.id}
                        href={`/player/${player.id}`}
                        className="bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
                      >
                        <p className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                          {player.name}
                        </p>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近のカルテ — PC:右, スマホ:下 */}
        <div className="mt-8 md:mt-0 md:w-72 md:shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-700">最近のカルテ</h2>
            <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
              直近6日
            </span>
          </div>

          {loadingRecent ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : recentKartes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300 gap-2">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs">直近6日のカルテはありません</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentKartes.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-green-500">{formatRelativeDate(r.createdAt)}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {r.playerId ? (
                      <Link
                        href={`/player/${r.playerId}`}
                        className="font-semibold text-sm text-gray-800 hover:text-green-600 transition-colors"
                      >
                        {r.clientName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-sm text-gray-800">{r.clientName}</span>
                    )}
                    <span className="text-xs text-gray-400">{r.trainerName}</span>
                  </div>
                  {r.treatmentScope && (
                    <span className="inline-block text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-medium border border-green-100 mb-1.5">
                      {r.treatmentScope}
                    </span>
                  )}
                  {r.chiefComplaint && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {r.chiefComplaint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
