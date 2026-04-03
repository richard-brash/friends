import type { RouteDetail, RouteSummary } from "../types/api";
import { apiClient } from "./client";

export async function getRoutes(): Promise<RouteSummary[]> {
  const { data } = await apiClient.get<RouteSummary[]>('/routes');

  return data;
}

export async function getRoute(id: string): Promise<RouteDetail> {
  const { data } = await apiClient.get<RouteDetail>(`/routes/${id}`);
  return data;
}
