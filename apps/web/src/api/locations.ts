import type { LocationDetail, LocationOption } from "../types/api";
import { apiClient } from "./client";

export async function getLocations(orgId?: string): Promise<LocationOption[]> {
  const { data } = await apiClient.get<LocationOption[]>("/locations", {
    params: orgId ? { orgId } : undefined,
  });
  return data;
}

export async function getLocation(id: string): Promise<LocationDetail> {
  const { data } = await apiClient.get<LocationDetail>(`/locations/${id}`);
  return data;
}
