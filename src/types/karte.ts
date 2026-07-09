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
