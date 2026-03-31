import { apiClient } from "./client";

export type UserRole = "admin" | "manager" | "volunteer";

export type UserCapabilities = {
  canManageUsers: boolean;
  canManageRequests: boolean;
  canDeliverItems: boolean;
};

export type OrgUser = {
  id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  organization_id: string;
  membership: { status: string } | null;
  roles: string[];
  capabilities: UserCapabilities;
};

export async function getOrgUsers(): Promise<OrgUser[]> {
  const { data } = await apiClient.get<OrgUser[]>("/user-access");
  return data;
}

export async function grantRole(userId: string, role: UserRole): Promise<OrgUser> {
  const { data } = await apiClient.post<OrgUser>(
    `/user-access/${encodeURIComponent(userId)}/roles`,
    { role },
  );
  return data;
}

export async function revokeRole(userId: string, roleName: UserRole): Promise<OrgUser> {
  const { data } = await apiClient.delete<OrgUser>(
    `/user-access/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleName)}`,
  );
  return data;
}

export async function replaceRoles(userId: string, roles: UserRole[]): Promise<OrgUser> {
  const { data } = await apiClient.put<OrgUser>(
    `/user-access/${encodeURIComponent(userId)}/roles`,
    { roles },
  );
  return data;
}
