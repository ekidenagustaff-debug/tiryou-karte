import { Client } from "@notionhq/client";
import { KarteRecord, KarteFormData, PlayerInfo } from "@/types/karte";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_MEDICAL_KARTE_DATABASE_ID!;
const MEMBERS_DATABASE_ID = process.env.NOTION_MEMBERS_DATABASE_ID!;

function richText(value: string) {
  return [{ text: { content: value } }];
}

function extractText(prop: PageObjectResponse["properties"][string]): string {
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "select") return prop.select?.name ?? "";
  return "";
}

function pageToKarte(page: PageObjectResponse): KarteRecord {
  const p = page.properties;
  const buinProp = p["部員"];
  const playerId =
    buinProp?.type === "relation" && buinProp.relation.length > 0
      ? buinProp.relation[0].id
      : undefined;
  return {
    id: page.id,
    playerId,
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
