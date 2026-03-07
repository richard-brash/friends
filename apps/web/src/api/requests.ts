import { apiClient } from "./client";

export type WarehouseRequestItem = {
  description: string;
  quantityRequested: number;
};

export type WarehouseRequest = {
  id: string;
  personName: string | null;
  locationName: string;
  items: WarehouseRequestItem[];
};

export async function getRequestedQueue(routeId?: string): Promise<WarehouseRequest[]> {
  const { data } = await apiClient.get<WarehouseRequest[]>("/requests", {
    params: {
      status: "REQUESTED",
      ...(routeId ? { routeId } : {}),
    },
  });
  return data;
}

export async function markRequestReady(requestId: string): Promise<void> {
  await apiClient.patch(`/requests/${requestId}/status`, {
    status: "READY",
  });
}
