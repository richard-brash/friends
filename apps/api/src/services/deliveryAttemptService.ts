import { DeliveryOutcome, PrismaClient, RequestStatus } from "@prisma/client";

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
            taken_by_user_id: true,
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

    const updatedItem = await tx.requestItem.update({
      where: { id: requestItem.id },
      data: {
        quantity_delivered: {
          increment: 1,
        },
      },
      select: {
        quantity_requested: true,
        quantity_delivered: true,
        request_id: true,
      },
    });

    if (updatedItem.quantity_delivered >= updatedItem.quantity_requested) {
      await tx.request.update({
        where: { id: updatedItem.request_id },
        data: {
          status: RequestStatus.DELIVERED,
        },
      });
    }
  });
}
