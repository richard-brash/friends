import { apiClient } from "./client";

export type EncounterItemInput = {
  label: string;
  quantity: number;
};

export type CreateEncounterPayload = {
  friendId?: string;
  friend_id?: string;
  person?: {
    id?: string;
    displayName?: string;
  };
  locationId: string;
  needs?: EncounterItemInput[];
  items?: Array<{ description: string; quantity: number }>;
  notes?: string;
  observation?: string;
};

export async function createEncounter(payload: CreateEncounterPayload): Promise<void> {
  await apiClient.post("/encounters", payload);
}