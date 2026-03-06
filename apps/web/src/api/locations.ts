import type { LocationDetail } from "../types/api";
import { apiClient } from "./client";

export async function getLocation(id: string): Promise<LocationDetail> {
  const { data } = await apiClient.get<LocationDetail>(`/locations/${id}`);
  return data;
}
