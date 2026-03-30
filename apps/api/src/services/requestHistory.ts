import { DeliveryOutcome, FulfillmentEventType } from "@prisma/client";

export type RequestHistoryEntry = {
  timestamp: string;
  title: string;
  detail?: string;
};

type RequestHistorySource = {
  created_at: Date;
  items: Array<{
    description: string;
    fulfillmentEvents: Array<{
      event_type: FulfillmentEventType;
      created_at: Date;
    }>;
    deliveryAttempts: Array<{
      outcome: DeliveryOutcome;
      attempted_at: Date;
      notes: string | null;
    }>;
  }>;
};

function formatOutcome(outcome: DeliveryOutcome): string {
  if (outcome === DeliveryOutcome.DELIVERED) {
    return "Delivered";
  }

  if (outcome === DeliveryOutcome.PERSON_NOT_FOUND) {
    return "Not found";
  }

  if (outcome === DeliveryOutcome.DECLINED) {
    return "Declined";
  }

  return "Location empty";
}

export function buildRequestHistory(request: RequestHistorySource): RequestHistoryEntry[] {
  const entries: RequestHistoryEntry[] = [
    {
      timestamp: request.created_at.toISOString(),
      title: "Request created",
    },
  ];

  const readyGroups = new Map<string, Set<string>>();

  for (const item of request.items) {
    for (const event of item.fulfillmentEvents) {
      if (event.event_type !== FulfillmentEventType.READY) {
        continue;
      }

      const key = event.created_at.toISOString();
      const existing = readyGroups.get(key) ?? new Set<string>();
      existing.add(item.description);
      readyGroups.set(key, existing);
    }

    for (const attempt of item.deliveryAttempts) {
      entries.push({
        timestamp: attempt.attempted_at.toISOString(),
        title: `Delivery attempt: ${formatOutcome(attempt.outcome)}`,
        detail: item.description,
      });
    }
  }

  for (const [timestamp, descriptions] of readyGroups.entries()) {
    const labels = Array.from(descriptions.values()).sort((left, right) => left.localeCompare(right));
    entries.push({
      timestamp,
      title: "Request marked ready",
      detail: labels.join(", "),
    });
  }

  return entries.sort((left, right) => {
    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
  });
}
