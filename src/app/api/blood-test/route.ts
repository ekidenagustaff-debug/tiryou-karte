import { NextRequest, NextResponse } from "next/server";
import { createBloodTestRecord, getBloodTestsByPlayer } from "@/lib/notion";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json({ error: "playerId は必須です" }, { status: 400 });
  }

  try {
    const records = await getBloodTestsByPlayer(playerId);
    return NextResponse.json(records);
  } catch (err) {
    console.error("Notion blood-test GET error:", err);
    return NextResponse.json({ error: "血液検査結果の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, clientName, testDate, memo, values } = body;

    if (!playerId?.trim() || !clientName?.trim() || !testDate?.trim()) {
      return NextResponse.json(
        { error: "選手ID・選手名・採血日は必須です" },
        { status: 400 }
      );
    }

    const record = await createBloodTestRecord({
      playerId,
      clientName,
      testDate,
      memo: memo ?? "",
      values: values && typeof values === "object" ? values : {},
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("Notion blood-test POST error:", err);
    return NextResponse.json({ error: "血液検査結果の保存に失敗しました" }, { status: 500 });
  }
}
