"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KarteFormData, KarteRecord, PersonalKarteRecord, PlayerInfo, RaceResult } from "@/types/karte";
import KarteForm from "@/components/KarteForm";
import MedicalKarteCard from "@/components/MedicalKarteCard";
import PersonalKarteCard from "@/components/PersonalKarteCard";
import RaceResultCard from "@/components/RaceResultCard";
import MiniCalendar from "@/components/MiniCalendar";

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

type HistoryItem =
  | { type: "medical"; sortKey: string; data: KarteRecord }
  | { type: "personal"; sortKey: string; data: PersonalKarteRecord }
  | { type: "race"; sortKey: string; data: RaceResult };

export default function KarteRecordPage() {
  const params = useParams();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [records, setRecords] = useState<KarteRecord[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalKarteRecord[]>([]);
  const [raceResults, setRaceResults] = useState<RaceResult[]>([]);
  const [loadingPlayer, setLoadingPlayer] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");

  const karteDates = records.map((r) => r.createdAt.slice(0, 10));
  const personalDates = personalRecords.map((r) => r.createdAt.slice(0, 10));
  const raceDates = raceResults.map((r) => r.date).filter(Boolean);

  const karteIndexMap = new Map(
    records
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((k, i) => [k.id, i])
  );

  const allItems: HistoryItem[] = [
    ...records.map((r) => ({ type: "medical" as const, sortKey: r.createdAt, data: r })),
    ...personalRecords.map((r) => ({ type: "personal" as const, sortKey: r.createdAt, data: r })),
    ...raceResults.map((r) => ({ type: "race" as const, sortKey: r.date, data: r })),
  ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const filteredItems = selectedDate
    ? allItems.filter((item) =>
        item.type === "race" ? item.data.date === selectedDate : item.data.createdAt.startsWith(selectedDate)
      )
    : allItems;

  useEffect(() => {
    fetch(`/api/players/${playerId}`)
      .then((r) => r.json())
      .then(setPlayer)
      .finally(() => setLoadingPlayer(false));

    fetch(`/api/race-results?playerId=${encodeURIComponent(playerId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRaceResults)
      .catch(() => {});

    fetch(`/api/personal-karte?playerId=${encodeURIComponent(playerId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPersonalRecords)
      .catch(() => {});
  }, [playerId]);

  const fetchRecords = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch(`/api/karte?playerId=${encodeURIComponent(playerId)}`);
      if (!res.ok) throw new Error("取得失敗");
      setRecords(await res.json());
    } catch {
      setHistoryError("カルテの読み込みに失敗しました");
    } finally {
      setLoadingHistory(false);
    }
  }, [playerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async (data: KarteFormData) => {
    const res = await fetch("/api/karte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("保存失敗");
    await fetchRecords();
    setActiveTab("history");
  };

  const playerName = player?.name ?? "";

  const historyContent = loadingHistory ? (
    <div className="flex items-center justify-center py-8 gap-2">
      <Spinner />
      <span className="text-sm text-gray-300">読み込み中...</span>
    </div>
  ) : historyError ? (
    <div className="flex flex-col items-center gap-2 py-8">
      <p className="text-sm text-red-400">{historyError}</p>
      <button onClick={fetchRecords} className="text-xs text-green-600 underline">再試行</button>
    </div>
  ) : allItems.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-32 text-gray-300 gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm">まだ記録はありません</p>
    </div>
  ) : filteredItems.length === 0 ? (
    <p className="text-sm text-gray-400 text-center py-6">
      {selectedDate?.replace(/-/g, "/")} の記録はありません
    </p>
  ) : (
    <div className="flex flex-col gap-3">
      {filteredItems.map((item) => {
        if (item.type === "medical") {
          return <MedicalKarteCard key={item.data.id} record={item.data} index={karteIndexMap.get(item.data.id) ?? 0} />;
        }
        if (item.type === "personal") {
          return <PersonalKarteCard key={item.data.id} record={item.data} />;
        }
        return <RaceResultCard key={item.data.id} result={item.data} />;
      })}
    </div>
  );

  const historyPanel = (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {!loadingHistory && !historyError && (
        <MiniCalendar
          karteDates={karteDates}
          personalDates={personalDates}
          raceDates={raceDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}
      {historyContent}
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="bg-green-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">S</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
          <Link href="/" className="hover:text-green-600 transition-colors shrink-0">選手一覧</Link>
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {loadingPlayer ? (
            <span className="text-gray-400">読み込み中...</span>
          ) : (
            <span className="text-gray-700 font-semibold truncate">
              {playerName}
              {player?.grade && <span className="ml-1 text-gray-400 font-normal">{player.grade}</span>}
            </span>
          )}
        </div>
      </header>

      <div className="md:hidden flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === "form"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-400"
          }`}
        >
          新規カルテ
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "history"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-400"
          }`}
        >
          記録
          {allItems.length > 0 && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              activeTab === "history" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
            }`}>
              {allItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="md:hidden flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === "form" ? (
          <div className="flex-1 overflow-y-auto p-4">
            {!loadingPlayer && player && (
              <KarteForm playerId={playerId} playerName={playerName} onSubmit={handleSubmit} />
            )}
          </div>
        ) : (
          historyPanel
        )}
      </div>

      <main className="hidden md:flex flex-1 overflow-hidden min-h-0">
        <section className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-700">新規カルテ記入</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("ja-JP", {
                year: "numeric", month: "long", day: "numeric", weekday: "long",
              })}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {!loadingPlayer && player && (
              <KarteForm playerId={playerId} playerName={playerName} onSubmit={handleSubmit} />
            )}
          </div>
        </section>

        <section className="w-1/2 flex flex-col bg-gray-50">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">記録</h2>
              <div className="flex items-center gap-2">
                {raceResults.length > 0 && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    大会 {raceResults.length}件
                  </span>
                )}
                {personalRecords.length > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    パーソナル {personalRecords.length}件
                  </span>
                )}
                {records.length > 0 && (
                  <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    メディカル {records.length}件
                  </span>
                )}
              </div>
            </div>
          </div>
          {historyPanel}
        </section>
      </main>
    </div>
  );
}
