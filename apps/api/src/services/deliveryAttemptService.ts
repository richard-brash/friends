import {
  DeliveryOutcome,
  EncounterType,
  FulfillmentEventType,
  NeedStatus,
  PrismaClient,
  RequestStatus,
} from "@prisma/client";
import { applyFulfillmentEventInTransaction } from "./fulfillmentEventService";

const prisma = new PrismaClient();

export class DeliveryAttemptServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "DeliveryAttemptServiceError";
    this.statusCode = statusCode;
  }
}

export type CreateDeliveryAttemptInput = {
  requestItemId: string;
  outcome: DeliveryOutcome;
  userId: string;
  routeId?: string;
  locationName?: string;
  notes?: string;
};

export async function createDeliveryAttempt(
  input: CreateDeliveryAttemptInput,
): Promise<void> {
  const attemptedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const requestItem = await tx.requestItem.findUnique({
      where: { id: input.requestItemId },
      select: {
        id: true,
        quantity_requested: true,
        quantity_delivered: true,
        status: true,
        request: {
          select: {
            id: true,
            person_id: true,
            status: true,
            taken_by_user_id: true,
            location: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!requestItem) {
      throw new DeliveryAttemptServiceError("Request item not found", 404);
    }

    if (input.outcome === DeliveryOutcome.DELIVERED && requestItem.status === NeedStatus.DELIVERED) {
      throw new DeliveryAttemptServiceError("Need is already delivered", 409);
    }

    const deliveryEncounter = await tx.encounter.create({
      data: {
        person_id: requestItem.request.person_id,
        route_id: input.routeId,
        request_id: requestItem.request.id,
        location_name: input.locationName ?? requestItem.request.location.name,
        type: EncounterType.DELIVERY,
        metadata: {
          source: "delivery-attempt",
          requestItemId: requestItem.id,
          outcome: input.outcome,
        },
      },
      select: { id: true },
    });

    await tx.deliveryAttempt.create({
      data: {
        request_item_id: requestItem.id,
        user_id: input.userId,
        attempted_at: attemptedAt,
        outcome: input.outcome,
        notes: input.notes,
      },
    });

    if (input.outcome === DeliveryOutcome.PERSON_NOT_FOUND) {
      await applyFulfillmentEventInTransaction(tx, {
        needId: requestItem.id,
        eventType: FulfillmentEventType.ATTEMPTED_NOT_FOUND,
        encounterId: deliveryEncounter.id,
        notes: input.notes,
      });
      return;
    }

    if (input.outcome !== DeliveryOutcome.DELIVERED) {
      return;
    }

    await applyFulfillmentEventInTransaction(tx, {
      needId: requestItem.id,
      eventType: FulfillmentEventType.DELIVERED,
      encounterId: deliveryEncounter.id,
      notes: input.notes,
    });

    await tx.requestItem.update({
      where: { id: requestItem.id },
      data: {
        quantity_delivered: {
          increment: 1,
        },
      },
    });

    const remainingItems = await tx.requestItem.count({
      where: {
        request_id: requestItem.request.id,
        quantity_delivered: {
          lt: prisma.requestItem.fields.quantity_requested,
        },
      },
    });

    if (remainingItems === 0 && requestItem.request.status !== RequestStatus.DELIVERED) {
      await tx.request.update({
        where: { id: requestItem.request.id },
        data: {
          status: RequestStatus.DELIVERED,
        },
      });
    }
  });
}
