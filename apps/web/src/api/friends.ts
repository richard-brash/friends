import { apiClient } from "./client";

export type FriendSummary = {
  id: string;
  preferred_name: string | null;
  aliases: string[];
};

export async function searchFriends(search: string, orgId: string): Promise<FriendSummary[]> {
  const { data } = await apiClient.get<FriendSummary[]>("/friends", {
    params: {
      search,
      orgId,
    },
  });

  return data;
}

export async function createFriend(input: {
  preferred_name: string;
  org_id: string;
  aliases?: string[];
}): Promise<FriendSummary> {
  const { data } = await apiClient.post<FriendSummary>("/friends", input);
  return data;
}
