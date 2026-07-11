import { Client } from "@notionhq/client";
import { KarteRecord, KarteFormData, PlayerInfo, RaceResult, PersonalKarteRecord, BloodTestRecord, BloodTestFormData } from "@/types/karte";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { ALL_BLOOD_TEST_ITEMS } from "@/lib/bloodTestItems";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_MEDICAL_KARTE_DATABASE_ID!;
const MEMBERS_DATABASE_ID = process.env.NOTION_MEMBERS_DATABASE_ID!;
const RACE_RESULTS_DATABASE_ID = process.env.NOTION_RACE_RESULTS_DATABASE_ID!;
const PERSONAL_KARTE_DATABASE_ID = process.env.NOTION_PERSONAL_KARTE_DATABASE_ID!;
const BLOOD_TEST_DATABASE_ID = process.env.NOTION_BLOOD_TEST_DATABASE_ID!;

function richText(value: string) {
  return [{ text: { content: value } }];
}

function extractText(prop: PageObjectResponse["properties"][string]): string {
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "select") return prop.select?.name ?? "";
  return "";
}

function extractTags(prop: PageObjectResponse["properties"][string]): string[] {
  if (prop.type === "multi_select") return prop.multi_select.map((t) => t.name);
  return [];
}

function extractRelationId(prop: PageObjectResponse["properties"][string]): string | undefined {
  return prop?.type === "relation" && prop.relation.length > 0 ? prop.relation[0].id : undefined;
}

function extractNumber(prop: PageObjectResponse["properties"][string]): number | undefined {
  return prop?.type === "number" && prop.number != null ? prop.number : undefined;
}

function extractDate(prop: PageObjectResponse["properties"][string]): string {
  return prop?.type === "date" && prop.date?.start ? prop.date.start.slice(0, 10) : "";
}

function pageToKarte(page: PageObjectResponse): KarteRecord {
  const p = page.properties;
  return {
    id: page.id,
    playerId: extractRelationId(p["部員"]),
    clientName: extractText(p["クライアント名"]),
    trainerName: extractText(p["担当トレーナー名"]),
    chiefComplaint: extractText(p["主訴"]),
    needleTreatment: extractText(p["針治療の有無"]) as KarteRecord["needleTreatment"],
    needleLocation: extractText(p["針治療の箇所"]),
    treatmentScope: extractText(p["治療範囲"]) as KarteRecord["treatmentScope"],
    overallAssessment: extractText(p["総評"]),
    createdAt: page.created_time,
  };
}

export async function getPlayers(): Promise<PlayerInfo[]> {
  const response = await notion.databases.query({
    database_id: MEMBERS_DATABASE_ID,
    filter: { property: "区分", select: { equals: "選手" } },
    page_size: 100,
  });

  return (response.results as PageObjectResponse[]).map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      name: extractText(p["氏名"]),
      grade: p["学年"] ? extractText(p["学年"]) || undefined : undefined,
      gender: p["性別"] ? extractText(p["性別"]) || undefined : undefined,
    };
  });
}

export async function getPlayerById(playerId: string): Promise<PlayerInfo | null> {
  try {
    const page = (await notion.pages.retrieve({ page_id: playerId })) as PageObjectResponse;
    const p = page.properties;
    return {
      id: page.id,
      name: extractText(p["氏名"]),
      grade: p["学年"] ? extractText(p["学年"]) || undefined : undefined,
      gender: p["性別"] ? extractText(p["性別"]) || undefined : undefined,
    };
  } catch {
    return null;
  }
}

export async function createKarteRecord(data: KarteFormData): Promise<KarteRecord> {
  const response = (await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      "クライアント名": { title: richText(data.clientName) },
      "担当トレーナー名": { select: { name: data.trainerName } },
      "主訴": { rich_text: richText(data.chiefComplaint) },
      "針治療の有無": data.needleTreatment
        ? { select: { name: data.needleTreatment } }
        : { select: null },
      "針治療の箇所": { rich_text: richText(data.needleLocation) },
      "治療範囲": data.treatmentScope
        ? { select: { name: data.treatmentScope } }
        : { select: null },
      "総評": { rich_text: richText(data.overallAssessment) },
      "部員": {
        relation: [{ id: data.playerId }],
      },
    },
  })) as PageObjectResponse;
  return pageToKarte(response);
}

export async function getKartesByPlayer(playerId: string): Promise<KarteRecord[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "部員",
      relation: { contains: playerId },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToKarte);
}

export async function getRecentKartes(days = 6): Promise<KarteRecord[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      timestamp: "created_time",
      created_time: { on_or_after: since.toISOString() },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 50,
  });
  return (response.results as PageObjectResponse[]).map(pageToKarte);
}

export async function getKarteDatesByPlayer(playerId: string): Promise<string[]> {
  const records = await getKartesByPlayer(playerId);
  const dates = new Set(records.map((r) => r.createdAt.slice(0, 10)));
  return Array.from(dates).sort();
}

function pageToRaceResult(page: PageObjectResponse): RaceResult {
  const p = page.properties;
  const dateProp = p["日付"];
  const date =
    dateProp?.type === "date" && dateProp.date?.start ? dateProp.date.start.slice(0, 10) : "";
  const rankProp = p["順位"];
  const rank = rankProp?.type === "number" && rankProp.number != null ? rankProp.number : undefined;
  return {
    id: page.id,
    competitionName: extractText(p["大会名"]),
    eventName: extractText(p["種目（表示）"]),
    date,
    result: extractText(p["記録"]),
    rank,
    flags: p["フラグ"] ? extractTags(p["フラグ"]) : [],
    venue: extractText(p["会場"]),
    notes: extractText(p["備考"]),
    category: extractText(p["種別"]),
  };
}

export async function getRaceResultsByPlayer(playerId: string): Promise<RaceResult[]> {
  const response = await notion.databases.query({
    database_id: RACE_RESULTS_DATABASE_ID,
    filter: {
      property: "選手名",
      relation: { contains: playerId },
    },
    sorts: [{ property: "日付", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToRaceResult);
}

function pageToPersonalKarte(page: PageObjectResponse): PersonalKarteRecord {
  const p = page.properties;
  return {
    id: page.id,
    playerId: extractRelationId(p["部員"]),
    clientName: extractText(p["クライアント名"]),
    trainerName: extractText(p["担当トレーナー名"]),
    chiefComplaint: extractText(p["主訴"]),
    trainingContent: extractText(p["トレーニング内容"]),
    overallAssessment: extractText(p["総評"]),
    tags: p["タグ"] ? extractTags(p["タグ"]) : [],
    createdAt: page.created_time,
  };
}

export async function getPersonalKartesByPlayer(playerId: string): Promise<PersonalKarteRecord[]> {
  const response = await notion.databases.query({
    database_id: PERSONAL_KARTE_DATABASE_ID,
    filter: {
      property: "部員",
      relation: { contains: playerId },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToPersonalKarte);
}

function pageToBloodTest(page: PageObjectResponse): BloodTestRecord {
  const p = page.properties;
  const values: Record<string, number> = {};
  for (const item of ALL_BLOOD_TEST_ITEMS) {
    const value = p[item.key] ? extractNumber(p[item.key]) : undefined;
    if (value != null) values[item.key] = value;
  }
  const testDate = extractDate(p["採血日"]) || page.created_time.slice(0, 10);
  return {
    id: page.id,
    playerId: extractRelationId(p["部員"]),
    clientName: extractText(p["クライアント名"]),
    testDate,
    memo: extractText(p["メモ"]),
    values,
    createdAt: page.created_time,
  };
}

export async function createBloodTestRecord(data: BloodTestFormData): Promise<BloodTestRecord> {
  const properties: Record<string, unknown> = {
    "クライアント名": { title: richText(data.clientName) },
    "採血日": { date: { start: data.testDate } },
    "メモ": { rich_text: richText(data.memo) },
    "部員": { relation: [{ id: data.playerId }] },
  };
  for (const item of ALL_BLOOD_TEST_ITEMS) {
    const value = data.values[item.key];
    if (value != null && !Number.isNaN(value)) {
      properties[item.key] = { number: value };
    }
  }
  const response = (await notion.pages.create({
    parent: { database_id: BLOOD_TEST_DATABASE_ID },
    properties: properties as Parameters<typeof notion.pages.create>[0]["properties"],
  })) as PageObjectResponse;
  return pageToBloodTest(response);
}

export async function getBloodTestsByPlayer(playerId: string): Promise<BloodTestRecord[]> {
  const response = await notion.databases.query({
    database_id: BLOOD_TEST_DATABASE_ID,
    filter: {
      property: "部員",
      relation: { contains: playerId },
    },
    sorts: [{ property: "採血日", direction: "descending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(pageToBloodTest);
}

export async function getBloodTestDatesByPlayer(playerId: string): Promise<string[]> {
  const records = await getBloodTestsByPlayer(playerId);
  const dates = new Set(records.map((r) => r.testDate));
  return Array.from(dates).sort();
}
