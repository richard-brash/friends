import { apiClient } from "./client";

export type InviteStatus = "PENDING" | "SENT" | "ACCEPTED" | "EXPIRED" | "REVOKED";
export type InviteChannel = "email" | "sms";

export type Invite = {
  id: string;
  destination: string;
  channel: InviteChannel;
  status: InviteStatus;
  expires_at: string | null;
  created_at: string;
  updated_at?: string;
  invitedByUser?: {
    name: string;
  } | null;
};

export async function getInvites(): Promise<Invite[]> {
  const res = await apiClient.get<Invite[]>("/invites");
  return res.data;
}

export async function sendInvite(destination: string, channel: InviteChannel): Promise<void> {
  await apiClient.post("/invites", { destination, channel });
}

export async function resendInvite(inviteId: string): Promise<void> {
  await apiClient.post(`/invites/${encodeURIComponent(inviteId)}/resend`);
}

export async function cancelInvite(inviteId: string): Promise<void> {
  await apiClient.delete(`/invites/${encodeURIComponent(inviteId)}/cancel`);
}

export async function removeInvite(inviteId: string): Promise<void> {
  await apiClient.delete(`/invites/${encodeURIComponent(inviteId)}`);
}
