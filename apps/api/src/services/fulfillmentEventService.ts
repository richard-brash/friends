import {
  FulfillmentEventType,
  NeedStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

export class FulfillmentEventServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "FulfillmentEventServiceError";
    this.statusCode = statusCode;
  }
}

export type ApplyFulfillmentEventInput = {
  needId: string;
  eventType: FulfillmentEventType;
  encounterId?: string;
  notes?: string;
};

const EVENT_TO_STATUS: Record<FulfillmentEventType, NeedStatus> = {
  [FulfillmentEventType.CREATED]: NeedStatus.OPEN,
  [FulfillmentEventType.READY]: NeedStatus.READY,
  [FulfillmentEventType.OUT_FOR_DELIVERY]: NeedStatus.OUT_FOR_DELIVERY,
  [FulfillmentEventType.DELIVERED]: NeedStatus.DELIVERED,
  [FulfillmentEventType.ATTEMPTED_NOT_FOUND]: NeedStatus.OPEN,
  [FulfillmentEventType.CLOSED_UNABLE]: NeedStatus.CLOSED_UNABLE,
  [FulfillmentEventType.UNAVAILABLE]: NeedStatus.UNAVAILABLE,
  [FulfillmentEventType.UNAVAILABLE_REVERSED]: NeedStatus.OPEN,
};

export async function applyFulfillmentEvent(
  input: ApplyFulfillmentEventInput,
): Promise<{ needId: string; status: NeedStatus }> {
  return prisma.$transaction((tx) => applyFulfillmentEventInTransaction(tx, input));
}

export async function applyFulfillmentEventInTransaction(
  tx: Prisma.TransactionClient,
  input: ApplyFulfillmentEventInput,
): Promise<{ needId: string; status: NeedStatus }> {
  const need = await tx.requestItem.findUnique({
    where: { id: input.needId },
    select: { id: true },
  });

  if (!need) {
    throw new FulfillmentEventServiceError("Need not found", 404);
  }

  if (input.encounterId) {
    const encounter = await tx.encounter.findUnique({
      where: { id: input.encounterId },
      select: { id: true },
    });

    if (!encounter) {
      throw new FulfillmentEventServiceError("Encounter not found", 404);
    }
  }

  const nextStatus = EVENT_TO_STATUS[input.eventType];

  await tx.fulfillmentEvent.create({
    data: {
      need_id: input.needId,
      encounter_id: input.encounterId,
      event_type: input.eventType,
      notes: input.notes,
    },
  });

  await tx.requestItem.update({
    where: { id: input.needId },
    data: {
      status: nextStatus,
    },
  });

  return {
    needId: input.needId,
    status: nextStatus,
  };
}
