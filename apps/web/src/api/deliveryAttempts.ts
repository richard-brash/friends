import { apiClient } from "./client";

export type DeliveryOutcome =
  | "DELIVERED"
  | "ATTEMPTED_NOT_FOUND"
  | "PERSON_NOT_FOUND"
  | "DECLINED"
  | "LOCATION_EMPTY";

export async function createDeliveryAttempt(
  requestItemId: string,
  outcome: DeliveryOutcome,
  options?: {
    routeId?: string;
    locationName?: string;
  },
): Promise<void> {
  await apiClient.post("/delivery-attempts", {
    requestItemId,
    outcome,
    routeId: options?.routeId,
    locationName: options?.locationName,
  });
}
