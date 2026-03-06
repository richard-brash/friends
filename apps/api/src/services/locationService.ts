import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type LocationPerson = {
  id: string;
  displayName: string | null;
};

export type LocationRequestItem = {
  description: string;
  quantityRequested: number;
};

export type LocationRequest = {
  id: string;
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
        include: {
          person: {
            select: {
              display_name: true,
            },
          },
          items: {
            select: {
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
    .filter((request) =>
      request.items.some(
        (item) => item.quantity_delivered < item.quantity_requested,
      ),
    )
    .map((request) => ({
      id: request.id,
      person: {
        displayName: request.person.display_name,
      },
      items: request.items.map((item) => ({
        description: item.description,
        quantityRequested: item.quantity_requested,
      })),
    }));

  return {
    id: location.id,
    name: location.name,
    people,
    requests,
  };
}
