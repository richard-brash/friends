import { apiClient } from "./client";

export type QuickPickItem = {
  id: string;
  label: string;
  sort_order: number;
};

export async function getQuickPickItems(orgId: string): Promise<QuickPickItem[]> {
  const res = await apiClient.get<QuickPickItem[]>(`/quick-pick-items?orgId=${encodeURIComponent(orgId)}`);
  return res.data;
}

export async function createQuickPickItem(
  orgId: string,
  label: string,
): Promise<QuickPickItem> {
  const res = await apiClient.post<QuickPickItem>("/quick-pick-items", { orgId, label });
  return res.data;
}

export async function updateQuickPickItem(
  id: string,
  orgId: string,
  data: { label?: string; sort_order?: number },
): Promise<QuickPickItem> {
  const res = await apiClient.patch<QuickPickItem>(`/quick-pick-items/${id}`, { orgId, ...data });
  return res.data;
}

export async function deleteQuickPickItem(id: string, orgId: string): Promise<void> {
  await apiClient.delete(`/quick-pick-items/${id}?orgId=${encodeURIComponent(orgId)}`);
}

export async function seedDefaultQuickPickItems(orgId: string): Promise<void> {
  await apiClient.post("/quick-pick-items/seed-defaults", { orgId });
}
