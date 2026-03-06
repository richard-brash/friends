import { PrismaClient, RequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

export type WarehouseRequestItem = {
  description: string;
  quantityRequested: number;
};

export type WarehouseRequestSummary = {
  id: string;
  personName: string | null;
  locationName: string;
  items: WarehouseRequestItem[];
};

export async function listRequestsByStatus(
  status: RequestStatus,
): Promise<WarehouseRequestSummary[]> {
  const requests = await prisma.request.findMany({
    where: { status },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
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
          description: true,
          quantity_requested: true,
        },
        orderBy: { created_at: "asc" },
      },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    personName: request.person.display_name,
    locationName: request.location.name,
    items: request.items.map((item) => ({
      description: item.description,
      quantityRequested: item.quantity_requested,
    })),
  }));
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
): Promise<{ id: string; status: RequestStatus } | null> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { id: true },
  });

  if (!request) {
    return null;
  }

  const updatedRequest = await prisma.request.update({
    where: { id: requestId },
    data: { status },
    select: {
      id: true,
      status: true,
    },
  });

  return {
    id: updatedRequest.id,
    status: updatedRequest.status,
  };
}
