import { apiClient } from "./client";

export type DeliveryOutcome =
  | "DELIVERED"
  | "PERSON_NOT_FOUND"
  | "DECLINED"
  | "LOCATION_EMPTY";

export async function createDeliveryAttempt(
  requestItemId: string,
  outcome: DeliveryOutcome,
  userId: string,
  options?: {
    routeId?: string;
    locationName?: string;
  },
): Promise<void> {
  await apiClient.post("/delivery-attempts", {
    requestItemId,
    outcome,
    userId,
    routeId: options?.routeId,
    locationName: options?.locationName,
  });
}
