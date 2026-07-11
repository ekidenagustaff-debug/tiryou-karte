export type NeedleTreatment = "あり" | "なし" | "";
export type TreatmentScope = "全身治療" | "部分治療" | "";

export interface KarteRecord {
  id: string;
  playerId?: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  needleTreatment: NeedleTreatment;
  needleLocation: string;
  treatmentScope: TreatmentScope;
  overallAssessment: string;
  createdAt: string;
}

export interface KarteFormData {
  playerId: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  needleTreatment: NeedleTreatment;
  needleLocation: string;
  treatmentScope: TreatmentScope;
  overallAssessment: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  grade?: string;
  gender?: string;
}

export interface RaceResult {
  id: string;
  competitionName: string;
  eventName: string;
  date: string; // "YYYY-MM-DD"
  result: string;
  rank?: number;
  flags: string[];
  venue: string;
  notes: string;
  category: string;
}

export interface PersonalKarteRecord {
  id: string;
  playerId?: string;
  clientName: string;
  trainerName: string;
  chiefComplaint: string;
  trainingContent: string;
  overallAssessment: string;
  tags: string[];
  createdAt: string;
}

export interface BloodTestRecord {
  id: string;
  playerId?: string;
  clientName: string;
  testDate: string; // "YYYY-MM-DD"
  memo: string;
  values: Record<string, number>;
  createdAt: string;
}
