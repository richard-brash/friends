import {
  DeliveryOutcome,
  EncounterType,
  PrismaClient,
  RequestStatus,
} from "@prisma/client";

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

    await tx.deliveryAttempt.create({
      data: {
        request_item_id: requestItem.id,
        user_id: requestItem.request.taken_by_user_id,
        attempted_at: attemptedAt,
        outcome: input.outcome,
        notes: input.notes,
      },
    });

    if (input.outcome !== DeliveryOutcome.DELIVERED) {
      return;
    }

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

      await tx.encounter.create({
        data: {
          person_id: requestItem.request.person_id,
          route_id: input.routeId,
          request_id: requestItem.request.id,
          location_name: input.locationName ?? requestItem.request.location.name,
          type: EncounterType.DELIVERY,
          metadata: {
            source: "delivery-attempt",
            requestItemId: requestItem.id,
          },
        },
      });
    }
  });
}
