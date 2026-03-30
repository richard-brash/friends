import { FulfillmentEventType, PrismaClient, RequestStatus } from "@prisma/client";
import { applyFulfillmentEventInTransaction } from "./fulfillmentEventService";
import { buildRequestHistory, type RequestHistoryEntry } from "./requestHistory";

const prisma = new PrismaClient();

export type WarehouseRequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
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
          },
        },
      },
    });

    if (!request) {
      return null;
    }

    if (status === RequestStatus.READY) {
      for (const item of request.items) {
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
