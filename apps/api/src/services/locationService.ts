import { PrismaClient, RequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

export type LocationPerson = {
  id: string;
  displayName: string | null;
};

export type LocationRequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
  quantityDelivered: number;
};

export type LocationRequest = {
  id: string;
  status: RequestStatus;
  person: {
    displayName: string | null;
  };
  items: LocationRequestItem[];
};

export type LocationDetails = {
  id: string;
  name: string;
  people: LocationPerson[];
  requests: LocationRequest[];
};

export async function getLocationById(
  locationId: string,
): Promise<LocationDetails | null> {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      name: true,
      personLocations: {
        orderBy: { observed_at: "desc" },
        select: {
          observed_at: true,
          person_id: true,
          person: {
            select: {
              id: true,
              display_name: true,
            },
          },
        },
      },
      requests: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          status: true,
          person: {
            select: {
              display_name: true,
            },
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity_requested: true,
              quantity_delivered: true,
            },
          },
        },
      },
    },
  });

  if (!location) {
    return null;
  }

  const seenPeople = new Set<string>();
  const people: LocationPerson[] = [];

  for (const personLocation of location.personLocations) {
    if (seenPeople.has(personLocation.person_id)) {
      continue;
    }

    seenPeople.add(personLocation.person_id);
    people.push({
      id: personLocation.person.id,
      displayName: personLocation.person.display_name,
    });
  }

  const requests: LocationRequest[] = location.requests
    .map((request) => ({
      id: request.id,
      status: request.status,
      person: {
        displayName: request.person.display_name,
      },
      items: request.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantityRequested: item.quantity_requested,
        quantityDelivered: item.quantity_delivered,
      })),
    }));

  return {
    id: location.id,
    name: location.name,
    people,
    requests,
  };
}
