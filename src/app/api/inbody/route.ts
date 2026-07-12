import { NextRequest, NextResponse } from "next/server";
import { createInBodyRecord, getInBodyRecordsByPlayer } from "@/lib/notion";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json({ error: "playerId は必須です" }, { status: 400 });
  }

  try {
    const records = await getInBodyRecordsByPlayer(playerId);
    return NextResponse.json(records);
  } catch (err) {
    console.error("Notion inbody GET error:", err);
    return NextResponse.json({ error: "InBody記録の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      playerId,
      clientName,
      measuredDate,
      trainerName,
      weight,
      skeletalMuscleMass,
      bodyFatMass,
      bodyFatPercentage,
      bmi,
      visceralFatLevel,
      memo,
    } = body;

    if (!playerId?.trim() || !clientName?.trim() || !trainerName?.trim() || !measuredDate?.trim()) {
      return NextResponse.json(
        { error: "選手ID・選手名・担当トレーナー名・測定日は必須です" },
        { status: 400 }
      );
    }

    const record = await createInBodyRecord({
      playerId,
      clientName,
      measuredDate,
      trainerName,
      weight: typeof weight === "number" ? weight : undefined,
      skeletalMuscleMass: typeof skeletalMuscleMass === "number" ? skeletalMuscleMass : undefined,
      bodyFatMass: typeof bodyFatMass === "number" ? bodyFatMass : undefined,
      bodyFatPercentage: typeof bodyFatPercentage === "number" ? bodyFatPercentage : undefined,
      bmi: typeof bmi === "number" ? bmi : undefined,
      visceralFatLevel: typeof visceralFatLevel === "number" ? visceralFatLevel : undefined,
      memo: memo ?? "",
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("Notion inbody POST error:", err);
    return NextResponse.json({ error: "InBody記録の保存に失敗しました" }, { status: 500 });
  }
}
