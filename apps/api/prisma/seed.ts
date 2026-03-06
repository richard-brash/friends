import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORG_NAME = "Friend Helper Outreach";

const routeDefinitions: Record<string, string[]> = {
  "Baltimore City 1": [
    "O Lot",
    "Grace & Hope Mission",
    "City Hall Park",
    "Fallsway Underpass",
    "Healthcare for the Homeless",
    "St. Vincent",
    "Shot Tower",
  ],
  "Baltimore City 2": [
    "Helping Up Mission",
    "Baltimore St & Exeter",
    "Lombard St",
    "Holocaust Memorial Park",
    "CFG Bank Area",
    "Greene St / University Area",
    "MLK Blvd Corridor",
    "Howard St / Chase St",
    "Preston St",
    "The Jungle",
    "Pigtown",
    "B&O Railroad Museum",
    "Pratt & MLK",
    "Market St",
    "Broadway",
  ],
  "Anne Arundel County": [
    "Brusters",
    "Library",
    "Mike's Sunset",
    "Behind La Fontaine Bleu",
    "Carroll Fuels",
    "Dunkin Donuts",
    "Annette",
    "Maisel Bros",
    "Ollie's (David)",
    "Chesapeake / Ordnance Rd",
    "Golden Corral",
    "Roses",
    "Royal Farms (Potee St)",
    "Village Liquors / Church St",
  ],
};

type PersonSeed = {
  name: string;
  alias?: string;
  locationName: string;
};

const peopleDefinitions: PersonSeed[] = [
  { name: "Mike", alias: "Tall Mike", locationName: "City Hall Park" },
  { name: "John", locationName: "Fallsway Underpass" },
  { name: "Maria", locationName: "O Lot" },
  { name: "Derrick", locationName: "Pratt & MLK" },
  { name: "Lisa", locationName: "Pigtown" },
];

type RequestSeed = {
  personName: string;
  locationName: string;
  items: Array<{ description: string; quantity: number }>;
};

const requestDefinitions: RequestSeed[] = [
  {
    personName: "Mike",
    locationName: "City Hall Park",
    items: [
      { description: "socks", quantity: 2 },
      { description: "underwear", quantity: 2 },
      { description: "shoes", quantity: 1 },
    ],
  },
  {
    personName: "John",
    locationName: "Fallsway Underpass",
    items: [{ description: "blanket", quantity: 1 }],
  },
  {
    personName: "Maria",
    locationName: "O Lot",
    items: [{ description: "socks", quantity: 3 }],
  },
  {
    personName: "Derrick",
    locationName: "Pratt & MLK",
    items: [{ description: "jacket", quantity: 1 }],
  },
  {
    personName: "Lisa",
    locationName: "Pigtown",
    items: [{ description: "tent", quantity: 1 }],
  },
];

function deterministicUuid(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 32);
  const bytes = hex.split("");
  bytes[12] = "4";
  bytes[16] = ["8", "9", "a", "b"][parseInt(bytes[16]!, 16) % 4]!;
  return `${bytes.slice(0, 8).join("")}-${bytes.slice(8, 12).join("")}-${bytes
    .slice(12, 16)
    .join("")}-${bytes.slice(16, 20).join("")}-${bytes.slice(20, 32).join("")}`;
}

function dateWithOffset(base: Date, offsetMinutes: number): Date {
  return new Date(base.getTime() + offsetMinutes * 60_000);
}

async function main(): Promise<void> {
  const now = new Date();

  const organizationId = deterministicUuid(`organization:${ORG_NAME}`);
  const defaultUserId = deterministicUuid("user:default-seed-user");

  const organization = await prisma.organization.upsert({
    where: { id: organizationId },
    update: { name: ORG_NAME },
    create: {
      id: organizationId,
      name: ORG_NAME,
    },
  });

  const defaultUser = await prisma.user.upsert({
    where: { id: defaultUserId },
    update: {
      organization_id: organization.id,
      email: "seed.user@friendhelper.org",
      name: "Seed User",
    },
    create: {
      id: defaultUserId,
      organization_id: organization.id,
      email: "seed.user@friendhelper.org",
      name: "Seed User",
    },
  });

  const routeByName = new Map<string, { id: string }>();
  const locationByName = new Map<string, { id: string }>();

  for (const [routeName, stopNames] of Object.entries(routeDefinitions)) {
    const routeId = deterministicUuid(`route:${organization.id}:${routeName}`);

    const route = await prisma.route.upsert({
      where: { id: routeId },
      update: {
        organization_id: organization.id,
        name: routeName,
      },
      create: {
        id: routeId,
        organization_id: organization.id,
        name: routeName,
      },
    });

    routeByName.set(routeName, { id: route.id });

    // Rebuild stop ordering each run so route edits are reflected deterministically.
    await prisma.routeLocation.deleteMany({
      where: { route_id: route.id },
    });

    for (const [index, locationName] of stopNames.entries()) {
      const locationId = deterministicUuid(
        `location:${organization.id}:${locationName}`,
      );

      const location = await prisma.location.upsert({
        where: { id: locationId },
        update: {
          organization_id: organization.id,
          name: locationName,
        },
        create: {
          id: locationId,
          organization_id: organization.id,
          name: locationName,
        },
      });

      locationByName.set(locationName, { id: location.id });

      await prisma.routeLocation.create({
        data: {
          id: deterministicUuid(`route-location:${route.id}:${index + 1}`),
          route_id: route.id,
          location_id: location.id,
          stop_order: index + 1,
        },
      });
    }
  }

  const personByName = new Map<string, { id: string }>();

  for (const [index, personDef] of peopleDefinitions.entries()) {
    const personId = deterministicUuid(
      `person:${organization.id}:${personDef.name.toLowerCase()}`,
    );

    const person = await prisma.person.upsert({
      where: { id: personId },
      update: {
        organization_id: organization.id,
        display_name: personDef.name,
      },
      create: {
        id: personId,
        organization_id: organization.id,
        display_name: personDef.name,
      },
    });

    personByName.set(personDef.name, { id: person.id });

    if (personDef.alias) {
      const aliasId = deterministicUuid(`person-alias:${person.id}:${personDef.alias}`);
      await prisma.personAlias.upsert({
        where: { id: aliasId },
        update: { alias: personDef.alias },
        create: {
          id: aliasId,
          person_id: person.id,
          alias: personDef.alias,
        },
      });
    }

    const location = locationByName.get(personDef.locationName);
    if (!location) {
      throw new Error(`Location not found for person assignment: ${personDef.locationName}`);
    }

    const personLocationId = deterministicUuid(
      `person-location:${person.id}:${location.id}`,
    );

    await prisma.personLocation.upsert({
      where: { id: personLocationId },
      update: {
        observed_at: dateWithOffset(now, index),
        observed_by_user_id: defaultUser.id,
      },
      create: {
        id: personLocationId,
        person_id: person.id,
        location_id: location.id,
        observed_at: dateWithOffset(now, index),
        observed_by_user_id: defaultUser.id,
      },
    });
  }

  for (const [requestIndex, requestDef] of requestDefinitions.entries()) {
    const person = personByName.get(requestDef.personName);
    if (!person) {
      throw new Error(`Person not found for request: ${requestDef.personName}`);
    }

    const location = locationByName.get(requestDef.locationName);
    if (!location) {
      throw new Error(`Location not found for request: ${requestDef.locationName}`);
    }

    const requestId = deterministicUuid(
      `request:${person.id}:${location.id}:${requestIndex}`,
    );

    const request = await prisma.request.upsert({
      where: { id: requestId },
      update: {
        person_id: person.id,
        location_id: location.id,
        taken_by_user_id: defaultUser.id,
        created_at: dateWithOffset(now, requestIndex + 10),
      },
      create: {
        id: requestId,
        person_id: person.id,
        location_id: location.id,
        taken_by_user_id: defaultUser.id,
        created_at: dateWithOffset(now, requestIndex + 10),
      },
    });

    for (const itemDef of requestDef.items) {
      const requestItemId = deterministicUuid(
        `request-item:${request.id}:${itemDef.description}`,
      );

      await prisma.requestItem.upsert({
        where: { id: requestItemId },
        update: {
          description: itemDef.description,
          quantity_requested: itemDef.quantity,
          quantity_fulfilled: 0,
          quantity_delivered: 0,
        },
        create: {
          id: requestItemId,
          request_id: request.id,
          description: itemDef.description,
          quantity_requested: itemDef.quantity,
          quantity_fulfilled: 0,
          quantity_delivered: 0,
        },
      });
    }
  }

  const routeCount = Object.keys(routeDefinitions).length;
  const locationCount = new Set(Object.values(routeDefinitions).flat()).size;
  const peopleCount = peopleDefinitions.length;
  const requestCount = requestDefinitions.length;

  console.log("Seed complete");
  console.log(`${routeCount} routes created`);
  console.log(`${locationCount} locations created`);
  console.log(`${peopleCount} people created`);
  console.log(`${requestCount} requests created`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
