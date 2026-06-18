export interface RobloxUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface RobloxUserProfile {
  id: number;
  username: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
  avatarUrl: string | null;
  followers: number;
  followings: number;
  friends: number;
}

async function tryFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

export async function searchRobloxUsers(keyword: string): Promise<RobloxUser[]> {
  const q = keyword.trim();
  if (q.length < 2) return [];
  try {
    const res = await tryFetch(`/api/roblox/search?keyword=${encodeURIComponent(q)}`);
    if (!res) return [];
    const json = (await res.json()) as { data?: RobloxUser[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchRobloxUserProfile(userId: number): Promise<RobloxUserProfile | null> {
  try {
    const res = await tryFetch(`/api/roblox/user/${userId}`);
    if (!res) return null;
    return (await res.json()) as RobloxUserProfile;
  } catch {
    return null;
  }
}

export async function fetchRobloxAvatar(username: string): Promise<{ id: number; username: string; displayName: string; avatarUrl: string | null } | null> {
  const q = username.trim();
  if (q.length < 2) return null;
  try {
    const res = await tryFetch(`/api/roblox/search?keyword=${encodeURIComponent(q)}`);
    if (!res) return null;
    const json = (await res.json()) as { data?: RobloxUser[] };
    const match = (json.data ?? []).find(
      (u) => u.username.toLowerCase() === q.toLowerCase()
    ) ?? json.data?.[0] ?? null;
    return match ?? null;
  } catch {
    return null;
  }
}
