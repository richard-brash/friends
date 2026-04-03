import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type RouteListItem = {
  id: string;
  name: string;
  stopCount: number;
};

export type RouteStop = {
  stopOrder: number;
  location: {
    id: string;
    name: string;
  };
};

export type RouteDetails = {
  id: string;
  name: string;
  stops: RouteStop[];
};

export async function getRoutesForOrganization(
  organizationId?: string,
): Promise<RouteListItem[]> {
  const normalizedOrganizationId = organizationId?.trim();
  let resolvedOrganizationId = normalizedOrganizationId;

  if (!resolvedOrganizationId) {
    const organization = await prisma.organization.findFirst({
      select: { id: true },
      orderBy: { created_at: 'asc' },
    });
    resolvedOrganizationId = organization?.id;
  }

  if (!resolvedOrganizationId) {
    return [];
  }

  const routes = await prisma.route.findMany({
    where: { organization_id: resolvedOrganizationId },
    select: {
      id: true,
      name: true,
      _count: {
        select: { stops: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return routes.map((route) => ({
    id: route.id,
    name: route.name,
    stopCount: route._count.stops,
  }));
}

export async function getRouteById(
  routeId: string,
  organizationId?: string,
): Promise<RouteDetails | null> {
  const normalizedOrganizationId = organizationId?.trim();
  const route = await prisma.route.findFirst({
    where: {
      id: routeId,
      ...(normalizedOrganizationId
        ? { organization_id: normalizedOrganizationId }
        : {}),
    },
    select: {
      id: true,
      name: true,
      stops: {
        orderBy: { stop_order: 'asc' },
        select: {
          stop_order: true,
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!route) {
    return null;
  }

  return {
    id: route.id,
    name: route.name,
    stops: route.stops.map((stop) => ({
      stopOrder: stop.stop_order,
      location: {
        id: stop.location.id,
        name: stop.location.name,
      },
    })),
  };
}
