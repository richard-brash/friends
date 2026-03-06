import { apiClient } from "./client";

export type EncounterItemInput = {
  description: string;
  quantity: number;
};

export type CreateEncounterPayload = {
  person: {
    displayName: string;
  };
  locationId: string;
  takenByUserId: string;
  items: EncounterItemInput[];
  observation?: string;
};

export async function createEncounter(payload: CreateEncounterPayload): Promise<void> {
  await apiClient.post("/encounters", payload);
}