import type { RouteDetail, RouteSummary } from "../types/api";
import { apiClient } from "./client";

export async function getRoutes(): Promise<RouteSummary[]> {
  const organizationId = import.meta.env.VITE_ORGANIZATION_ID;

  const { data } = await apiClient.get<RouteSummary[]>("/routes", {
    params: organizationId ? { organizationId } : undefined,
  });

  return data;
}

export async function getRoute(id: string): Promise<RouteDetail> {
  const { data } = await apiClient.get<RouteDetail>(`/routes/${id}`);
  return data;
}
