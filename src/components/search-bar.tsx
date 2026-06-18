import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, X, Users, Gamepad2, Eye, Users2, Heart,
  Calendar, ArrowLeft,
} from "lucide-react";

/* ── Types ── */
interface UserResult  { id: number; username: string; displayName: string; avatarUrl: string | null; }
interface GameResult  { id: number; rootPlaceId: number; name: string; playing: number; placeVisits: number; genre: string; favoritedCount: number; thumbnailUrl: string | null; }
interface UserProfile extends UserResult { description: string; created: string; followers: number; followings: number; friends: number; }
interface GameDetail  { id: number; rootPlaceId: number; name: string; description: string; creator: { name: string }; playing: number; visits: number; maxPlayers: number; created: string; updated: string; genre: string; favoritedCount: number; thumbnailUrl: string | null; }

const fmt = (n: number) =>
  n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + "B"
  : n >= 1_000_000   ? (n / 1_000_000).toFixed(1)   + "M"
  : n >= 1_000       ? (n / 1_000).toFixed(1)        + "K"
  : String(n);

const BASE = "/api";

/* ── shared search hook ── */
function useRobloxSearch() {
  const [query,        setQuery]        = useState("");
  const [users,        setUsers]        = useState<UserResult[]>([]);
  const [games,        setGames]        = useState<GameResult[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) { setUsers([]); setGames([]); return; }
    setLoadingUsers(true); setLoadingGames(true);
    fetch(`${BASE}/roblox/search?keyword=${encodeURIComponent(q)}`)
      .then(r => r.json()).then(d => { setUsers(d.data ?? []); setLoadingUsers(false); })
      .catch(() => setLoadingUsers(false));
    fetch(`${BASE}/roblox/search-games?keyword=${encodeURIComponent(q)}`)
      .then(r => r.json()).then(d => { setGames(d.data ?? []); setLoadingGames(false); })
      .catch(() => setLoadingGames(false));
  }, []);

  function onChange(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 320);
  }

  function clear() { setQuery(""); setUsers([]); setGames([]); }

  const loading    = loadingUsers || loadingGames;
  const hasResults = users.length > 0 || games.length > 0;
  return { query, users, games, loading, hasResults, onChange, clear };
}

/* ── UserDetailModal ── */
function UserDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/roblox/user/${userId}`)
      .then(r => r.json()).then(d => { setProfile(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const joinYear = profile?.created ? new Date(profile.created).getFullYear() : null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl w-full max-w-[360px] overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2e]">
          <button onClick={onClose} className="p-1 text-[#9a9a9f] hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] font-bold text-white">Profile</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3a3a3e] border-t-[#4a8af4] rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <>
            <div className="flex flex-col items-center pt-6 pb-4 px-4 gap-2">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-20 h-20 rounded-full border-2 border-[#3a3a3e] object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#3a3a3c] border-2 border-[#555557] flex items-center justify-center text-2xl font-black text-white uppercase">
                  {profile.username.charAt(0)}
                </div>
              )}
              <div className="text-center">
                <div className="text-[15px] font-black text-white">{profile.displayName}</div>
                <div className="text-[12px] text-[#9a9a9f]">@{profile.username}</div>
              </div>
            </div>

            <div className="flex items-center divide-x divide-[#2a2a2e] mx-4 mb-4 bg-[#111113] rounded-lg border border-[#2a2a2e]">
              {[
                { icon: Users2, label: "Friends",   val: fmt(profile.friends)   },
                { icon: Eye,    label: "Followers",  val: fmt(profile.followers)  },
                { icon: Users,  label: "Following",  val: fmt(profile.followings) },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex-1 flex flex-col items-center py-2.5 gap-0.5">
                  <Icon className="h-3.5 w-3.5 text-[#9a9a9f] mb-0.5" />
                  <span className="text-[13px] font-bold text-white">{val}</span>
                  <span className="text-[9px] text-[#555557]">{label}</span>
                </div>
              ))}
            </div>

            {profile.description ? (
              <div className="mx-4 mb-3 px-3 py-2.5 bg-[#111113] border border-[#2a2a2e] rounded-lg">
                <p className="text-[11px] text-[#9a9a9f] leading-relaxed line-clamp-4">{profile.description}</p>
              </div>
            ) : null}

            <div className="flex items-center gap-2 mx-4 mb-4 px-3 py-2 bg-[#111113] border border-[#2a2a2e] rounded-lg">
              <Calendar className="h-3.5 w-3.5 text-[#9a9a9f] shrink-0" />
              <span className="text-[11px] text-[#9a9a9f]">Member since <span className="text-white font-semibold">{joinYear}</span></span>
            </div>

            <div className="px-4 pb-4">
              <a href={`https://www.roblox.com/users/${profile.id}/profile`} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2 text-center text-[12px] font-bold text-white bg-[#4a8af4] hover:bg-[#3a7ae0] rounded-lg transition-colors">
                View on Roblox.com
              </a>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-[13px] text-[#9a9a9f]">Could not load profile.</div>
        )}
      </div>
    </div>
  );
}

/* ── GameDetailModal ── */
function GameDetailModal({ universeId, onClose }: { universeId: number; onClose: () => void }) {
  const [game, setGame]     = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/roblox/game/${universeId}`)
      .then(r => r.json()).then(d => { setGame(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [universeId]);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl w-full max-w-[380px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2e] sticky top-0 bg-[#1a1a1c] z-10">
          <button onClick={onClose} className="p-1 text-[#9a9a9f] hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] font-bold text-white">Game</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3a3a3e] border-t-[#4a8af4] rounded-full animate-spin" />
          </div>
        ) : game ? (
          <>
            {game.thumbnailUrl ? (
              <img src={game.thumbnailUrl} alt={game.name} className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video bg-[#2a2a2e] flex items-center justify-center">
                <Gamepad2 className="h-10 w-10 text-[#3a3a3e]" />
              </div>
            )}

            <div className="px-4 pt-3 pb-1">
              <div className="text-[15px] font-black text-white leading-tight">{game.name}</div>
              <div className="text-[11px] text-[#9a9a9f] mt-0.5">by <span className="text-white">{game.creator?.name}</span></div>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              {[
                { icon: Users,  label: "Playing",   val: fmt(game.playing)        },
                { icon: Eye,    label: "Visits",     val: fmt(game.visits)         },
                { icon: Heart,  label: "Favorites",  val: fmt(game.favoritedCount) },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="bg-[#111113] border border-[#2a2a2e] rounded-lg py-2.5 flex flex-col items-center gap-0.5">
                  <Icon className="h-3.5 w-3.5 text-[#9a9a9f] mb-0.5" />
                  <span className="text-[13px] font-bold text-white">{val}</span>
                  <span className="text-[9px] text-[#555557]">{label}</span>
                </div>
              ))}
            </div>

            <div className="px-4 pb-2 space-y-1.5">
              {game.genre && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9a9a9f]">Genre</span>
                  <span className="text-white">{game.genre}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9a9a9f]">Max players</span>
                <span className="text-white">{game.maxPlayers}</span>
              </div>
              {game.created && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9a9a9f]">Created</span>
                  <span className="text-white">{fmtDate(game.created)}</span>
                </div>
              )}
            </div>

            {game.description ? (
              <div className="mx-4 mb-3 px-3 py-2.5 bg-[#111113] border border-[#2a2a2e] rounded-lg">
                <p className="text-[11px] text-[#9a9a9f] leading-relaxed line-clamp-3">{game.description}</p>
              </div>
            ) : null}

            <div className="px-4 pb-4">
              <a href={`https://www.roblox.com/games/${game.rootPlaceId}`} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2 text-center text-[12px] font-bold text-white bg-[#4a8af4] hover:bg-[#3a7ae0] rounded-lg transition-colors">
                Play on Roblox.com
              </a>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-[13px] text-[#9a9a9f]">Could not load game.</div>
        )}
      </div>
    </div>
  );
}

/* ── shared results list (used in both desktop dropdown + mobile overlay) ── */
function ResultsList({
  query, users, games, loading, hasResults,
  onSelectUser, onSelectGame,
  mobile = false,
}: {
  query: string; users: UserResult[]; games: GameResult[];
  loading: boolean; hasResults: boolean;
  onSelectUser: (id: number) => void;
  onSelectGame: (id: number) => void;
  mobile?: boolean;
}) {
  if (query.length < 2) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${mobile ? "py-20" : "py-8"}`}>
        <Search className="h-6 w-6 text-[#3a3a3e]" />
        <span className="text-[12px] text-[#555557]">Search for players or games</span>
      </div>
    );
  }

  if (loading && !hasResults) {
    return (
      <div className={`flex items-center justify-center gap-2 ${mobile ? "py-20" : "py-8"}`}>
        <div className="w-4 h-4 border-2 border-[#3a3a3e] border-t-[#4a8af4] rounded-full animate-spin" />
        <span className="text-[12px] text-[#9a9a9f]">Searching…</span>
      </div>
    );
  }

  if (!loading && !hasResults) {
    return (
      <div className={`${mobile ? "py-20" : "py-8"} text-center text-[12px] text-[#9a9a9f]`}>
        No results for "{query}"
      </div>
    );
  }

  return (
    <>
      {users.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
            <Users className="h-3 w-3 text-[#9a9a9f]" />
            <span className="text-[10px] font-bold text-[#9a9a9f] uppercase tracking-wider">People</span>
          </div>
          {users.slice(0, 8).map((u) => (
            <button key={u.id} onClick={() => onSelectUser(u.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#252527] active:bg-[#2a2a2e] transition-colors text-left">
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.username} className="w-9 h-9 rounded-full border border-[#3a3a3e] object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#3a3a3c] border border-[#555557] flex items-center justify-center shrink-0 text-white text-[12px] font-bold uppercase">
                  {u.username.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">{u.displayName}</div>
                <div className="text-[11px] text-[#9a9a9f] truncate">@{u.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {games.length > 0 && (
        <div className={users.length > 0 ? "border-t border-[#2a2a2e]" : ""}>
          <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
            <Gamepad2 className="h-3 w-3 text-[#9a9a9f]" />
            <span className="text-[10px] font-bold text-[#9a9a9f] uppercase tracking-wider">Games</span>
          </div>
          {games.slice(0, 5).map((g) => (
            <button key={g.id} onClick={() => onSelectGame(g.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#252527] active:bg-[#2a2a2e] transition-colors text-left">
              {g.thumbnailUrl ? (
                <img src={g.thumbnailUrl} alt={g.name} className="w-14 h-9 rounded object-cover shrink-0 border border-[#3a3a3e]" />
              ) : (
                <div className="w-14 h-9 rounded bg-[#2a2a2e] border border-[#3a3a3e] flex items-center justify-center shrink-0">
                  <Gamepad2 className="h-4 w-4 text-[#555557]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white truncate">{g.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#4caf50]">● {fmt(g.playing)} playing</span>
                  <span className="text-[10px] text-[#9a9a9f]">{fmt(g.placeVisits)} visits</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Desktop SearchBar (navbar dropdown) ── */
export function SearchBar() {
  const { query, users, games, loading, hasResults, onChange, clear } = useRobloxSearch();
  const [open,         setOpen]         = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(e.target.value.length >= 1);
  }

  function handleClear() { clear(); setOpen(false); inputRef.current?.focus(); }

  return (
    <>
      <div ref={containerRef} className="relative w-full max-w-[240px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9a9a9f] pointer-events-none" />
        <input
          ref={inputRef} type="text" value={query}
          onChange={handleChange}
          onFocus={() => { if (query.length >= 1) setOpen(true); }}
          placeholder="Search"
          className="w-full h-[28px] pl-7 pr-7 bg-[#2a2a2e] border border-[#3a3a3e] rounded text-[12px] text-white placeholder:text-[#9a9a9f] focus:outline-none focus:border-[#555557] transition-colors"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9a9a9f] hover:text-white transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}

        {open && (
          <div className="absolute left-0 top-full mt-1 w-[340px] bg-[#1e1e20] border border-[#2a2a2e] rounded-lg shadow-2xl z-[300] overflow-hidden max-h-[480px] overflow-y-auto">
            <ResultsList
              query={query} users={users} games={games}
              loading={loading} hasResults={hasResults}
              onSelectUser={(id) => { setSelectedUser(id); setOpen(false); }}
              onSelectGame={(id) => { setSelectedGame(id); setOpen(false); }}
            />
            {hasResults && (
              <div className="border-t border-[#2a2a2e] px-3 py-2 text-center">
                <span className="text-[10px] text-[#555557]">Tap a result to see details</span>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedUser !== null && <UserDetailModal userId={selectedUser}       onClose={() => setSelectedUser(null)} />}
      {selectedGame !== null && <GameDetailModal universeId={selectedGame}   onClose={() => setSelectedGame(null)} />}
    </>
  );
}

/* ── Mobile Search Overlay (full-screen) ── */
export function MobileSearchOverlay({ onClose }: { onClose: () => void }) {
  const { query, users, games, loading, hasResults, onChange, clear } = useRobloxSearch();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // auto-focus input when overlay opens
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  // close on back button / escape
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  function handleClear() { clear(); inputRef.current?.focus(); }

  return (
    <>
      {/* Full-screen overlay below navbar */}
      <div className="fixed inset-0 top-[44px] z-[400] bg-[#111113] flex flex-col">

        {/* Search input row */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2e] bg-[#1a1a1c] shrink-0">
          <button onClick={onClose} className="p-1.5 text-[#9a9a9f] hover:text-white transition-colors shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a9f] pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search players or games…"
              className="w-full h-[38px] pl-9 pr-9 bg-[#2a2a2e] border border-[#3a3a3e] rounded-lg text-[14px] text-white placeholder:text-[#555557] focus:outline-none focus:border-[#4a8af4] transition-colors"
            />
            {query && (
              <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9a9a9f] hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results scroll area */}
        <div className="flex-1 overflow-y-auto bg-[#1e1e20]">
          <ResultsList
            query={query} users={users} games={games}
            loading={loading} hasResults={hasResults}
            onSelectUser={(id) => setSelectedUser(id)}
            onSelectGame={(id) => setSelectedGame(id)}
            mobile
          />
        </div>
      </div>

      {selectedUser !== null && <UserDetailModal userId={selectedUser}     onClose={() => setSelectedUser(null)} />}
      {selectedGame !== null && <GameDetailModal universeId={selectedGame} onClose={() => setSelectedGame(null)} />}
    </>
  );
}
