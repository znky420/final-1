import { Router, type IRouter } from "express";

const router: IRouter = Router();

/* ── helpers ── */
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ── GET /api/roblox/search?keyword=X  (user search — search API + exact lookup merged) ── */
router.get("/roblox/search", async (req, res) => {
  const keyword = String(req.query["keyword"] ?? "").trim();
  if (keyword.length < 2) { res.status(400).json({ error: "keyword too short" }); return; }

  try {
    // Run both search strategies in parallel for better coverage
    const [searchJson, exactJson] = await Promise.all([
      fetchJson<{ data: Array<{ id: number; name: string; displayName: string }> }>(
        `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(keyword)}&limit=8`
      ),
      // Exact username POST lookup — catches users the search API misses
      (async () => {
        try {
          const r = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ usernames: [keyword], excludeBannedUsers: false }),
          });
          if (!r.ok) return null;
          return (await r.json()) as { data: Array<{ id: number; name: string; displayName: string; requestedUsername: string }> };
        } catch { return null; }
      })(),
    ]);

    // Merge and deduplicate
    const seen = new Set<number>();
    const merged: Array<{ id: number; name: string; displayName: string }> = [];

    // Exact match first (highest priority)
    for (const u of exactJson?.data ?? []) {
      if (!seen.has(u.id)) { seen.add(u.id); merged.push({ id: u.id, name: u.name, displayName: u.displayName }); }
    }
    for (const u of searchJson?.data ?? []) {
      if (!seen.has(u.id)) { seen.add(u.id); merged.push(u); }
    }

    if (merged.length === 0) { res.json({ data: [] }); return; }

    const ids = merged.map((u) => u.id).join(",");
    const thumbJson = await fetchJson<{ data: Array<{ targetId: number; imageUrl: string }> }>(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids}&size=150x150&format=Png`
    );
    const thumbMap = new Map((thumbJson?.data ?? []).map((t) => [t.targetId, t.imageUrl]));

    res.json({
      data: merged.map((u) => ({
        id: u.id,
        username: u.name,
        displayName: u.displayName,
        avatarUrl: thumbMap.get(u.id) ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Roblox user search error");
    res.status(502).json({ error: "proxy error", data: [] });
  }
});

/* ── GET /api/roblox/search-games?keyword=X ── */
router.get("/roblox/search-games", async (req, res) => {
  const keyword = String(req.query["keyword"] ?? "").trim();
  if (keyword.length < 2) { res.status(400).json({ error: "keyword too short" }); return; }

  try {
    const json = await fetchJson<{
      games: Array<{
        id: number;
        rootPlaceId: number;
        name: string;
        description: string;
        placeVisits: number;
        playing: number;
        maxPlayers: number;
        genre: string;
        isAllGenre: boolean;
        favoritedCount: number;
      }>;
    }>(
      `https://games.roblox.com/v1/games/list?model.keyword=${encodeURIComponent(keyword)}&model.maxRows=6&model.startRows=0&model.sortToken=`
    );

    const games = json?.games ?? [];
    if (games.length === 0) { res.json({ data: [] }); return; }

    // Fetch game thumbnails
    const universeIds = games.map((g) => g.id).join(",");
    const thumbJson = await fetchJson<{
      data: Array<{ universeId: number; thumbnails: Array<{ imageUrl: string }> }>;
    }>(
      `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&size=768x432&format=Png&isCircular=false`
    );
    const thumbMap = new Map(
      (thumbJson?.data ?? []).map((t) => [t.universeId, t.thumbnails?.[0]?.imageUrl ?? null])
    );

    res.json({
      data: games.map((g) => ({
        id: g.id,
        rootPlaceId: g.rootPlaceId,
        name: g.name,
        playing: g.playing,
        placeVisits: g.placeVisits,
        genre: g.genre,
        favoritedCount: g.favoritedCount,
        thumbnailUrl: thumbMap.get(g.id) ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Roblox game search error");
    res.status(502).json({ error: "proxy error", data: [] });
  }
});

/* ── GET /api/roblox/user/:id  (profile details) ── */
router.get("/roblox/user/:id", async (req, res) => {
  const userId = Number(req.params["id"]);
  if (!userId) { res.status(400).json({ error: "invalid id" }); return; }

  try {
    const [profile, avatarJson, followersJson, followingsJson, friendsJson] = await Promise.all([
      fetchJson<{ id: number; name: string; displayName: string; description: string; created: string; isBanned: boolean }>(
        `https://users.roblox.com/v1/users/${userId}`
      ),
      fetchJson<{ data: Array<{ imageUrl: string }> }>(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`
      ),
      fetchJson<{ count: number }>(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
      fetchJson<{ count: number }>(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
      fetchJson<{ count: number }>(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
    ]);

    if (!profile) { res.status(404).json({ error: "user not found" }); return; }

    res.json({
      id: profile.id,
      username: profile.name,
      displayName: profile.displayName,
      description: profile.description || "",
      created: profile.created,
      isBanned: profile.isBanned,
      avatarUrl: avatarJson?.data?.[0]?.imageUrl ?? null,
      followers: followersJson?.count ?? 0,
      followings: followingsJson?.count ?? 0,
      friends: friendsJson?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Roblox user profile error");
    res.status(502).json({ error: "proxy error" });
  }
});

/* ── GET /api/roblox/game/:universeId  (game details) ── */
router.get("/roblox/game/:universeId", async (req, res) => {
  const universeId = Number(req.params["universeId"]);
  if (!universeId) { res.status(400).json({ error: "invalid id" }); return; }

  try {
    const [gameJson, thumbJson] = await Promise.all([
      fetchJson<{
        data: Array<{
          id: number; rootPlaceId: number; name: string; description: string;
          creator: { id: number; name: string; type: string };
          playing: number; visits: number; maxPlayers: number;
          created: string; updated: string; genre: string;
          favoritedCount: number; rating: number;
        }>;
      }>(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
      fetchJson<{ data: Array<{ universeId: number; thumbnails: Array<{ imageUrl: string }> }> }>(
        `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&size=768x432&format=Png`
      ),
    ]);

    const game = gameJson?.data?.[0];
    if (!game) { res.status(404).json({ error: "game not found" }); return; }

    res.json({
      id: game.id,
      rootPlaceId: game.rootPlaceId,
      name: game.name,
      description: game.description || "",
      creator: game.creator,
      playing: game.playing,
      visits: game.visits,
      maxPlayers: game.maxPlayers,
      created: game.created,
      updated: game.updated,
      genre: game.genre,
      favoritedCount: game.favoritedCount,
      thumbnailUrl: thumbJson?.data?.[0]?.thumbnails?.[0]?.imageUrl ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Roblox game detail error");
    res.status(502).json({ error: "proxy error" });
  }
});

export default router;
