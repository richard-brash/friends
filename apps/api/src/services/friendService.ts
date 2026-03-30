import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class FriendServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "FriendServiceError";
    this.statusCode = statusCode;
  }
}

export type FriendSummary = {
  id: string;
  preferred_name: string | null;
  aliases: string[];
};

export async function searchFriends(
  search: string,
  orgId: string,
  limit = 12,
): Promise<FriendSummary[]> {
  const query = search.trim();
  if (!query) {
    return [];
  }

  const normalizedLimit = Math.min(Math.max(limit, 10), 15);

  const friends = await prisma.person.findMany({
    where: {
      organization_id: orgId,
      OR: [
        {
          display_name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          aliases: {
            some: {
              alias: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      display_name: true,
      aliases: {
        select: {
          alias: true,
        },
        orderBy: {
          created_at: "asc",
        },
      },
      last_seen_at: true,
    },
    orderBy: [
      {
        last_seen_at: "desc",
      },
      {
        created_at: "desc",
      },
    ],
    take: normalizedLimit,
  });

  return friends.map((friend) => ({
    id: friend.id,
    preferred_name: friend.display_name,
    aliases: friend.aliases.map((alias) => alias.alias),
  }));
}

export async function createFriend(input: {
  orgId: string;
  preferredName: string;
  aliases?: string[];
}): Promise<FriendSummary> {
  const preferredName = input.preferredName.trim();
  if (!preferredName) {
    throw new FriendServiceError("preferred_name is required", 400);
  }

  const created = await prisma.person.create({
    data: {
      organization_id: input.orgId,
      display_name: preferredName,
      aliases: input.aliases?.length
        ? {
            createMany: {
              data: input.aliases
                .map((value) => value.trim())
                .filter((value) => value.length > 0)
                .map((alias) => ({ alias })),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
    select: {
      id: true,
      display_name: true,
      aliases: {
        select: {
          alias: true,
        },
      },
    },
  });

  return {
    id: created.id,
    preferred_name: created.display_name,
    aliases: created.aliases.map((alias) => alias.alias),
  };
}
