import { apiClient } from "./client";

export type CurrentUser = {
  id: string;
  name: string;
  email: string | null;
  phone_number?: string | null;
  organization_id: string;
  role: "admin" | "manager" | "volunteer";
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser>("/me");
  return data;
}
