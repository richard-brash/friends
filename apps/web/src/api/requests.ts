import { apiClient } from "./client";
import type { RequestHistoryEntry } from "../types/api";

export type WarehouseRequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
};

export type WarehouseRequest = {
  id: string;
  status: "REQUESTED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
  personName: string | null;
  locationName: string;
  createdAt: string;
  items: WarehouseRequestItem[];
  history: RequestHistoryEntry[];
};

export async function getRequests(
  status?: string,
  routeId?: string,
): Promise<WarehouseRequest[]> {
  const { data } = await apiClient.get<WarehouseRequest[]>("/requests", {
    params: {
      ...(status ? { status } : {}),
      ...(routeId ? { routeId } : {}),
    },
  });
  return data;
}

/** @deprecated use getRequests('REQUESTED', routeId) */
export async function getRequestedQueue(routeId?: string): Promise<WarehouseRequest[]> {
  return getRequests("REQUESTED", routeId);
}

export async function markRequestReady(requestId: string): Promise<void> {
  await apiClient.patch(`/requests/${requestId}/status`, {
    status: "READY",
  });
}
