import { PrismaClient, RequestStatus } from "@prisma/client";
import { buildRequestHistory, type RequestHistoryEntry } from "./requestHistory";

const prisma = new PrismaClient();

export type LocationPerson = {
  id: string;
  displayName: string | null;
  lastEncounterAt: string | null;
  lastEncounterLocationName: string | null;
};

export type LocationRequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
  quantityDelivered: number;
  status: "OPEN" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CLOSED_UNABLE" | "UNAVAILABLE" | "UNAVAILABLE_REVERSED";
};

export type LocationRequest = {
  id: string;
  status: RequestStatus;
  history: RequestHistoryEntry[];
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

export type LocationOption = {
  id: string;
  name: string;
};

export async function listLocations(orgId?: string): Promise<LocationOption[]> {
  const locations = await prisma.location.findMany({
    where: {
      is_active: true,
      ...(orgId ? { organization_id: orgId } : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return locations.map((location) => ({
    id: location.id,
    name: location.name,
  }));
}

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
          created_at: true,
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
          },
        },
      },
    },
  });

  if (!location) {
    return null;
  }

  const seenPeople = new Set<string>();
  const peopleBase: Array<{ id: string; displayName: string | null }> = [];

  for (const personLocation of location.personLocations) {
    if (seenPeople.has(personLocation.person_id)) {
      continue;
    }

    seenPeople.add(personLocation.person_id);
    peopleBase.push({
      id: personLocation.person.id,
      displayName: personLocation.person.display_name,
    });
  }

  const latestEncountersByPerson = new Map<
    string,
    { createdAt: string; locationName: string | null }
  >();

  if (peopleBase.length > 0) {
    const personIds = peopleBase.map((person) => person.id);
    const encounters = await prisma.encounter.findMany({
      where: {
        person_id: {
          in: personIds,
        },
      },
      select: {
        person_id: true,
        created_at: true,
        location_name: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    for (const encounter of encounters) {
      if (latestEncountersByPerson.has(encounter.person_id)) {
        continue;
      }

      latestEncountersByPerson.set(encounter.person_id, {
        createdAt: encounter.created_at.toISOString(),
        locationName: encounter.location_name,
      });
    }
  }

  const people: LocationPerson[] = peopleBase.map((person) => {
    const latestEncounter = latestEncountersByPerson.get(person.id);

    return {
      id: person.id,
      displayName: person.displayName,
      lastEncounterAt: latestEncounter?.createdAt ?? null,
      lastEncounterLocationName: latestEncounter?.locationName ?? null,
    };
  });

  const requests: LocationRequest[] = location.requests
    .map((request) => ({
      id: request.id,
      status: request.status,
      history: buildRequestHistory(request),
      person: {
        displayName: request.person.display_name,
      },
      items: request.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantityRequested: item.quantity_requested,
        quantityDelivered: item.quantity_delivered,
            status: item.status,
      })),
    }));

  return {
    id: location.id,
    name: location.name,
    people,
    requests,
  };
}
