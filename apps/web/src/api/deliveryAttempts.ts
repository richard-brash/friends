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
): Promise<void> {
  await apiClient.post("/delivery-attempts", {
    requestItemId,
    outcome,
    userId,
  });
}
