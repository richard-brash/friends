import { PrismaClient, RequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class EncounterServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "EncounterServiceError";
    this.statusCode = statusCode;
  }
}

export type EncounterItemInput = {
  description: string;
  quantity: number;
};

export type EncounterInput = {
  person: {
    id?: string;
    displayName?: string;
    alias?: string;
  };
  locationId: string;
  takenByUserId: string;
  items: EncounterItemInput[];
  observation?: string;
};

export type EncounterRequestResponse = {
  id: string;
  status: RequestStatus;
  personId: string;
  locationId: string;
  takenByUserId: string;
  createdAt: Date;
  items: Array<{
    id: string;
    description: string;
    quantityRequested: number;
    quantityFulfilled: number;
    quantityDelivered: number;
  }>;
};

export async function createEncounter(
  input: EncounterInput,
): Promise<EncounterRequestResponse> {
  const observedAt = new Date();

  return prisma.$transaction(async (tx) => {
    const [location, takenByUser] = await Promise.all([
      tx.location.findUnique({
        where: { id: input.locationId },
        select: { id: true, organization_id: true },
      }),
      tx.user.findUnique({
        where: { id: input.takenByUserId },
        select: { id: true, organization_id: true },
      }),
    ]);

    if (!location) {
      throw new EncounterServiceError("Location not found", 404);
    }

    if (!takenByUser) {
      throw new EncounterServiceError("User not found", 404);
    }

    if (location.organization_id !== takenByUser.organization_id) {
      throw new EncounterServiceError(
        "User and location must belong to the same organization",
        400,
      );
    }

    let personId = input.person.id;

    if (personId) {
      const existingPerson = await tx.person.findUnique({
        where: { id: personId },
        select: { id: true, organization_id: true },
      });

      if (!existingPerson) {
        throw new EncounterServiceError("Person not found", 404);
      }

      if (existingPerson.organization_id !== takenByUser.organization_id) {
        throw new EncounterServiceError(
          "Person must belong to the same organization as the user",
          400,
        );
      }
    } else {
      const createdPerson = await tx.person.create({
        data: {
          organization_id: takenByUser.organization_id,
          display_name: input.person.displayName ?? null,
        },
        select: { id: true },
      });

      personId = createdPerson.id;
    }

    if (!personId) {
      throw new EncounterServiceError("Unable to resolve person", 400);
    }

    if (input.person.alias?.trim()) {
      await tx.personAlias.createMany({
        data: [
          {
            person_id: personId,
            alias: input.person.alias.trim(),
          },
        ],
        skipDuplicates: true,
      });
    }

    await tx.personLocation.create({
      data: {
        person_id: personId,
        location_id: location.id,
        observed_by_user_id: takenByUser.id,
        observed_at: observedAt,
      },
    });

    const request = await tx.request.create({
      data: {
        person_id: personId,
        location_id: location.id,
        taken_by_user_id: takenByUser.id,
        status: RequestStatus.REQUESTED,
      },
      select: {
        id: true,
        status: true,
        person_id: true,
        location_id: true,
        taken_by_user_id: true,
        created_at: true,
      },
    });

    await tx.requestItem.createMany({
      data: input.items.map((item) => ({
        request_id: request.id,
        description: item.description,
        quantity_requested: item.quantity,
        quantity_fulfilled: 0,
        quantity_delivered: 0,
      })),
    });

    if (input.observation?.trim()) {
      await tx.observation.create({
        data: {
          person_id: personId,
          location_id: location.id,
          observed_by_user_id: takenByUser.id,
          observed_at: observedAt,
          notes: input.observation.trim(),
        },
      });
    }

    const requestWithItems = await tx.request.findUnique({
      where: { id: request.id },
      select: {
        id: true,
        status: true,
        person_id: true,
        location_id: true,
        taken_by_user_id: true,
        created_at: true,
        items: {
          select: {
            id: true,
            description: true,
            quantity_requested: true,
            quantity_fulfilled: true,
            quantity_delivered: true,
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!requestWithItems) {
      throw new EncounterServiceError("Encounter request was not created", 500);
    }

    return {
      id: requestWithItems.id,
      status: requestWithItems.status,
      personId: requestWithItems.person_id,
      locationId: requestWithItems.location_id,
      takenByUserId: requestWithItems.taken_by_user_id,
      createdAt: requestWithItems.created_at,
      items: requestWithItems.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantityRequested: item.quantity_requested,
        quantityFulfilled: item.quantity_fulfilled,
        quantityDelivered: item.quantity_delivered,
      })),
    };
  });
}
