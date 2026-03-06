import { DeliveryOutcome, PrismaClient, RequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

export type DashboardStats = {
  todaysActivity: {
    encountersToday: number;
    requestsCreatedToday: number;
    itemsDeliveredToday: number;
  };
  warehouseStatus: {
    REQUESTED: number;
    READY: number;
    DELIVERED: number;
  };
  topRequestedItems: Array<{
    description: string;
    count: number;
  }>;
};

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const startOfToday = getStartOfToday();

  const [encountersToday, requestsCreatedToday, itemsDeliveredToday, groupedStatusCounts, topRequestedItems] =
    await Promise.all([
      prisma.personLocation.count({
        where: {
          observed_at: {
            gte: startOfToday,
          },
        },
      }),
      prisma.request.count({
        where: {
          created_at: {
            gte: startOfToday,
          },
        },
      }),
      prisma.deliveryAttempt.count({
        where: {
          attempted_at: {
            gte: startOfToday,
          },
          outcome: DeliveryOutcome.DELIVERED,
        },
      }),
      prisma.request.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
        where: {
          status: {
            in: [RequestStatus.REQUESTED, RequestStatus.READY, RequestStatus.DELIVERED],
          },
        },
      }),
      prisma.requestItem.groupBy({
        by: ['description'],
        _count: {
          description: true,
        },
        orderBy: {
          _count: {
            description: 'desc',
          },
        },
        take: 8,
      }),
    ]);

  const warehouseStatus: DashboardStats['warehouseStatus'] = {
    REQUESTED: 0,
    READY: 0,
    DELIVERED: 0,
  };

  for (const item of groupedStatusCounts) {
    if (item.status in warehouseStatus) {
      warehouseStatus[item.status as keyof DashboardStats['warehouseStatus']] = item._count._all;
    }
  }

  return {
    todaysActivity: {
      encountersToday,
      requestsCreatedToday,
      itemsDeliveredToday,
    },
    warehouseStatus,
    topRequestedItems: topRequestedItems.map((item) => ({
      description: item.description,
      count: item._count.description,
    })),
  };
}
