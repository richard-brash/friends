import { apiClient } from "./client";
import type { RequestHistoryEntry } from "../types/api";

export type NeedStatus = "OPEN" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CLOSED_UNABLE" | "UNAVAILABLE";

export type WarehouseRequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
  status: NeedStatus;
};

export type WarehouseRequest = {
  id: string;
  status: "REQUESTED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "CLOSED_UNABLE";
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

export async function addRequestItem(
  requestId: string,
  payload: { description: string; quantity: number },
): Promise<void> {
  await apiClient.post(`/requests/${requestId}/items`, {
    description: payload.description,
    quantityRequested: payload.quantity,
  });
}

export async function updateRequestItem(
  requestId: string,
  itemId: string,
  payload: { description: string; quantity: number },
): Promise<void> {
  await apiClient.patch(`/requests/${requestId}/items/${itemId}`, {
    description: payload.description,
    quantityRequested: payload.quantity,
  });
}

export async function closeRequest(requestId: string): Promise<void> {
  await apiClient.patch(`/requests/${requestId}/status`, {
    status: "CLOSED_UNABLE",
  });
}

export async function applyItemAction(
  requestId: string,
  itemId: string,
  payload: { action: string; notes: string },
): Promise<void> {
  await apiClient.post(`/requests/${requestId}/items/${itemId}/actions`, payload);
}
