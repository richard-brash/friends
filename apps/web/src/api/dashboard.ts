import { apiClient } from './client';

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

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard');
  return data;
}
