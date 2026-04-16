                                                                                                                import { FulfillmentEventType, NeedStatus, PrismaClient, RequestStatus } from "@prisma/client";
import { applyFulfillmentEventInTransaction } from "./fulfillmentEventService";
import { buildRequestHistory, type RequestHistoryEntry } from "./requestHistory";

const prisma = new PrismaClient();

export type WarehouseRequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
  status: string;
};

export type WarehouseRequestSummary = {
  id: string;
  status: RequestStatus;
  personName: string | null;
  locationName: string;
  createdAt: string;
  items: WarehouseRequestItem[];
  history: RequestHistoryEntry[];
};

export async function listRequestsByStatus(
  status?: RequestStatus,
  routeId?: string,
): Promise<WarehouseRequestSummary[]> {
  const normalizedRouteId = routeId?.trim();

  const requests = await prisma.request.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(normalizedRouteId
        ? {
            location: {
              routeLocations: {
                some: {
                  route_id: normalizedRouteId,
                },
              },
            },
          }
        : {}),
    },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      status: true,
      created_at: true,
      person: {
        select: {
          display_name: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          id: true,
          description: true,
          quantity_requested: true,
          status: true,
          fulfillmentEvents: {
            select: {
              event_type: true,
              created_at: true,
            },
            orderBy: { created_at: "asc" },
          },
          deliveryAttempts: {
            select: {
              outcome: true,
              attempted_at: true,
              notes: true,
            },
            orderBy: { attempted_at: "asc" },
          },
        },
        orderBy: { created_at: "asc" },
      },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    status: request.status,
    createdAt: request.created_at.toISOString(),
    personName: request.person.display_name,
    locationName: request.location.name,
    items: request.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantityRequested: item.quantity_requested,
      status: item.status,
    })),
    history: buildRequestHistory(request),
  }));
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  actorUserId: string,
): Promise<{ id: string; status: RequestStatus } | null> {
  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!request) {
      return null;
    }

    if (status === RequestStatus.READY) {
      for (const item of request.items) {
        // Skip items already handled by warehouse
        if (
          item.status === NeedStatus.READY ||
          item.status === NeedStatus.UNAVAILABLE ||
          item.status === NeedStatus.DELIVERED ||
          item.status === NeedStatus.CLOSED_UNABLE
        ) {
          continue;
        }

        await applyFulfillmentEventInTransaction(tx, {
          needId: item.id,
          eventType: FulfillmentEventType.READY,
        });

        await tx.requestItem.update({
          where: { id: item.id },
          data: {
            fulfilled_by_user_id: actorUserId,
            fulfilled_at: new Date(),
            quantity_fulfilled: {
              increment: 1,
            },
          },
        });
      }
    }

    if (status === RequestStatus.CLOSED_UNABLE) {
      for (const item of request.items) {
        if (
          item.status === NeedStatus.DELIVERED ||
          item.status === NeedStatus.CLOSED_UNABLE
        ) {
          continue;
        }

        await applyFulfillmentEventInTransaction(tx, {
          needId: item.id,
          eventType: FulfillmentEventType.CLOSED_UNABLE,
        });
      }
    }

    return tx.request.update({
      where: { id: requestId },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });
  });

  if (!updatedRequest) {
    return null;
  }

  return {
    id: updatedRequest.id,
    status: updatedRequest.status,
  };
}

export async function addRequestItem(
  requestId: string,
  description: string,
  quantityRequested: number,
): Promise<{ id: string } | null> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });

  if (!request) return null;

  if (request.status !== RequestStatus.REQUESTED && request.status !== RequestStatus.PREPARING) {
    throw new Error("REQUEST_NOT_EDITABLE");
  }

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.requestItem.create({
      data: {
        request_id: requestId,
        description,
        quantity_requested: quantityRequested,
      },
      select: { id: true },
    });

    await applyFulfillmentEventInTransaction(tx, {
      needId: created.id,
      eventType: FulfillmentEventType.CREATED,
    });

    return created;
  });

  return { id: item.id };
}

export async function updateRequestItem(
  requestId: string,
  itemId: string,
  description: string,
  quantityRequested: number,
): Promise<{ id: string } | null> {
  const item = await prisma.requestItem.findUnique({
    where: { id: itemId },
    select: { id: true, request_id: true, status: true },
  });

  if (!item || item.request_id !== requestId) return null;

  if (item.status !== NeedStatus.OPEN && item.status !== NeedStatus.READY) {
    throw new Error("ITEM_NOT_EDITABLE");
  }

  await prisma.requestItem.update({
    where: { id: itemId },
    data: { description, quantity_requested: quantityRequested },
  });

  return { id: itemId };
}

const ACTION_TO_EVENT: Record<string, FulfillmentEventType> = {
  "mark-unavailable": FulfillmentEventType.UNAVAILABLE,
  "mark-available": FulfillmentEventType.UNAVAILABLE_REVERSED,
  "close-unable": FulfillmentEventType.CLOSED_UNABLE,
};

export async function pickItem(
  requestId: string,
  itemId: string,
  actorUserId: string,
): Promise<{ id: string; status: NeedStatus } | null> {
  const item = await prisma.requestItem.findUnique({
    where: { id: itemId },
    select: { id: true, request_id: true, status: true },
  });

  if (!item || item.request_id !== requestId) return null;
  if (item.status !== NeedStatus.OPEN) throw new Error("ITEM_NOT_PICKABLE");

  const result = await prisma.$transaction(async (tx) => {
    const event = await applyFulfillmentEventInTransaction(tx, {
      needId: itemId,
      eventType: FulfillmentEventType.READY,
    });

    await tx.requestItem.update({
      where: { id: itemId },
      data: {
        fulfilled_by_user_id: actorUserId,
        fulfilled_at: new Date(),
        quantity_fulfilled: { increment: 1 },
      },
    });

    return event;
  });

  return { id: result.needId, status: result.status };
}

export async function applyNeedAction(
  requestId: string,
  itemId: string,
  action: string,
  notes: string,
): Promise<{ id: string; status: NeedStatus } | null> {
  const eventType = ACTION_TO_EVENT[action];
  if (!eventType) throw new Error("UNKNOWN_ACTION");

  const item = await prisma.requestItem.findUnique({
    where: { id: itemId },
    select: { id: true, request_id: true },
  });

  if (!item || item.request_id !== requestId) return null;

  const result = await prisma.$transaction((tx) =>
    applyFulfillmentEventInTransaction(tx, {
      needId: itemId,
      eventType,
      notes: notes || undefined,
    }),
  );

  return { id: result.needId, status: result.status };
}
