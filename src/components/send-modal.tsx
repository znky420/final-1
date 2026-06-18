import { useState, useCallback, useRef, useEffect } from "react";
import { useWalletContext } from "@/hooks/use-wallet-context";
import { RecentStore, RecentRecipient } from "@/lib/storage";
import { searchRobloxUsers, fetchRobloxUserProfile, RobloxUser, RobloxUserProfile } from "@/lib/roblox-api";
import { X, Search, Users } from "lucide-react";
import { toast } from "sonner";
import robuxIconUrl from "@assets/1000011212-removebg-preview_1781123352374.png";

type Step = "search" | "amount" | "confirm";

const PRESET_AMOUNTS = [25, 50, 100, 200];

interface Props {
  open: boolean;
  onClose: () => void;
}

function RobuxCoin({ size = 16 }: { size?: number }) {
  return (
    <img src={robuxIconUrl} alt="R" className="invert shrink-0" style={{ width: size, height: size }} />
  );
}

function UserAvatar({ avatarUrl, username, size }: { avatarUrl: string | null; username: string; size: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#3a3a3c] flex items-center justify-center font-bold text-white shrink-0 uppercase"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {username.charAt(0)}
    </div>
  );
}

function formatJoinAge(created: string): string {
  const joined = new Date(created);
  const now = new Date();
  const years = now.getFullYear() - joined.getFullYear() -
    (now.getMonth() < joined.getMonth() || (now.getMonth() === joined.getMonth() && now.getDate() < joined.getDate()) ? 1 : 0);
  const months = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (years >= 1) return `vor ${years} ${years === 1 ? "Jahr" : "Jahren"}`;
  if (months >= 1) return `vor ${months} ${months === 1 ? "Monat" : "Monaten"}`;
  return "vor weniger als einem Monat";
}

export function SendModal({ open, onClose }: Props) {
  const { balance, deduct, addTransaction } = useWalletContext();

  const [step, setStep]                       = useState<Step>("search");
  const [searchInput, setSearchInput]         = useState("");
  const [loading, setLoading]                 = useState(false);
  const [results, setResults]                 = useState<RobloxUser[]>([]);
  const [searchError, setSearchError]         = useState("");
  const [selectedUser, setSelectedUser]       = useState<RobloxUser | null>(null);
  const [selectedAmount, setSelectedAmount]   = useState<number | null>(null);
  const [customAmount, setCustomAmount]       = useState("");
  const [recent, setRecent]                   = useState<RecentRecipient[]>([]);
  const [userProfile, setUserProfile]         = useState<RobloxUserProfile | null>(null);
  const [profileLoading, setProfileLoading]   = useState(false);
  const [sending, setSending]                 = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) setRecent(RecentStore.getAll());
  }, [open]);

  function handleClose() {
    setStep("search");
    setSearchInput("");
    setResults([]);
    setSearchError("");
    setSelectedUser(null);
    setSelectedAmount(null);
    setCustomAmount("");
    setUserProfile(null);
    setSending(false);
    onClose();
  }

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearchError(""); return; }
    setLoading(true);
    setResults([]);
    setSearchError("");
    const found = await searchRobloxUsers(q);
    if (found.length === 0) {
      setSearchError(`Kein Spieler gefunden: "${q}"`);
    } else {
      setResults(found.slice(0, 5));
    }
    setLoading(false);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchInput(val);
    setResults([]);
    setSearchError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function fetchProfile(userId: number) {
    setUserProfile(null);
    setProfileLoading(true);
    fetchRobloxUserProfile(userId).then((profile) => {
      setUserProfile(profile);
      setProfileLoading(false);
    });
  }

  function handleSelectUser(user: RobloxUser) {
    setSelectedUser(user);
    setSelectedAmount(null);
    setCustomAmount("");
    fetchProfile(user.id);
    setStep("amount");
  }

  function handleSelectRecent(r: RecentRecipient) {
    setSelectedUser({ id: r.id, username: r.username, displayName: r.displayName, avatarUrl: r.avatarUrl });
    setSelectedAmount(r.lastAmount);
    setCustomAmount("");
    fetchProfile(r.id);
    setStep("amount");
  }

  function getAmount(): number {
    if (selectedAmount !== null) return selectedAmount;
    return parseInt(customAmount, 10) || 0;
  }

  function handleContinue() {
    const amt = getAmount();
    if (amt < 1 || amt > balance) return;
    setStep("confirm");
  }

  function handleSend() {
    const amt = getAmount();
    if (amt < 1 || amt > balance || !selectedUser || sending) return;

    setSending(true);

    deduct(amt);
    addTransaction({
      type: "outgoing",
      amount: amt,
      date: new Date(),
      party: selectedUser.displayName || selectedUser.username,
      description: "Robux gesendet",
    });
    RecentStore.add({
      id: selectedUser.id,
      username: selectedUser.username,
      displayName: selectedUser.displayName,
      avatarUrl: selectedUser.avatarUrl,
      lastAmount: amt,
    });

    const recipient = selectedUser.username;
    const sentAmt = amt;

    setTimeout(() => {
      handleClose();
      toast.success(`✓ Successfully sent ${sentAmt.toLocaleString("de-DE")} Robux to @${recipient}`, {
        duration: 4000,
      });
    }, 500);
  }

  const isSearching = searchInput.trim().length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-[340px] bg-[#1e1e20] rounded-xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-[#2a2a2e]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#2a2a2e] flex items-center justify-center shrink-0">
              <RobuxCoin size={12} />
            </div>
            <span className="text-[14px] font-bold text-white">Send Robux</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <RobuxCoin size={14} />
              <span className="text-[13px] font-bold text-white">{balance.toLocaleString("de-DE")}</span>
            </div>
            <button onClick={handleClose} className="text-[#9a9a9f] hover:text-white transition-colors ml-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Step: Search ── */}
        {step === "search" && (
          <div className="px-4 py-4 space-y-3">
            <p className="text-[13px] font-semibold text-white">Search by username</p>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9a9a9f]" />
              <input
                data-testid="input-username-search"
                type="text"
                placeholder="Search username"
                value={searchInput}
                onChange={handleInputChange}
                autoFocus
                className="w-full h-10 pl-8 pr-3 bg-[#2a2a2e] border border-[#3a3a3e] rounded-lg text-[13px] text-white placeholder:text-[#666668] focus:outline-none focus:border-[#4a8af4] transition-colors"
              />
            </div>

            {loading && (
              <div className="flex items-center gap-2 py-1">
                <div className="w-3.5 h-3.5 border-2 border-[#3a3a3e] border-t-[#4a8af4] rounded-full animate-spin" />
                <span className="text-[12px] text-[#9a9a9f]">Searching…</span>
              </div>
            )}

            {searchError && !loading && (
              <p className="text-[12px] text-[#e8273c]">{searchError}</p>
            )}

            {results.length > 0 && (
              <div className="space-y-1 pt-0.5">
                {results.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#252527] hover:bg-[#2f2f31] cursor-pointer transition-colors"
                  >
                    <UserAvatar avatarUrl={user.avatarUrl} username={user.username} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white truncate">{user.displayName}</div>
                      <div className="text-[11px] text-[#9a9a9f] truncate">@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && recent.length > 0 && (
              <div>
                <div className="h-px bg-[#2a2a2e] mb-3" />
                <p className="text-[11px] text-[#9a9a9f] font-semibold uppercase tracking-wide mb-2">Recent</p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRecent(r)}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                    >
                      <UserAvatar avatarUrl={r.avatarUrl} username={r.username} size={44} />
                      <span className="text-[11px] text-[#9a9a9f] group-hover:text-white transition-colors truncate max-w-[52px] text-center">
                        {r.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step: Amount ── */}
        {step === "amount" && selectedUser && (
          <div className="px-4 pt-5 pb-5 flex flex-col items-center">
            <UserAvatar avatarUrl={selectedUser.avatarUrl} username={selectedUser.username} size={80} />
            <div className="mt-2 mb-5 text-center">
              <div className="text-[15px] font-bold text-white">{selectedUser.displayName}</div>
            </div>

            <div className="flex gap-2 w-full mb-3">
              {PRESET_AMOUNTS.map((amt) => {
                const active = selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                    className={`flex-1 flex items-center justify-center gap-1 h-9 rounded-md text-[12px] font-semibold transition-colors border ${
                      active
                        ? "bg-[#1e3060] border-[#4a8af4] text-white"
                        : "bg-[#252527] border-[#3a3a3e] text-[#cccccc] hover:bg-[#2f2f31]"
                    }`}
                  >
                    <RobuxCoin size={11} />
                    {amt}
                  </button>
                );
              })}
            </div>

            <div
              className={`flex items-center gap-2 h-9 px-3 rounded-md border w-full mb-4 transition-colors cursor-text ${
                selectedAmount === null && customAmount
                  ? "bg-[#1e3060] border-[#4a8af4]"
                  : "bg-[#252527] border-[#3a3a3e]"
              }`}
              onClick={() => (document.getElementById("custom-amount-input") as HTMLInputElement)?.focus()}
            >
              <RobuxCoin size={12} />
              <input
                id="custom-amount-input"
                type="number"
                min={1}
                max={balance}
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                className="bg-transparent text-[12px] text-white w-full focus:outline-none placeholder:text-[#555557] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <button
              onClick={handleContinue}
              disabled={getAmount() < 1 || getAmount() > balance}
              className="w-full h-10 bg-[#4a8af4] hover:bg-[#3a7ae0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-full transition-colors"
            >
              Next
            </button>

            <p className="text-[11px] text-[#666668] mt-2.5 text-center">
              Robux are sent instantly with no fees.
            </p>
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === "confirm" && selectedUser && (
          <div className="px-4 pt-5 pb-5 flex flex-col items-center">
            <UserAvatar avatarUrl={selectedUser.avatarUrl} username={selectedUser.username} size={80} />

            <div className="mt-2 text-center">
              <div className="text-[15px] font-bold text-white">{selectedUser.displayName}</div>
              <div className="text-[12px] text-[#9a9a9f]">@{selectedUser.username}</div>
            </div>

            <div className="flex items-center gap-3 mt-2.5 mb-4">
              {profileLoading ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[#666668]">
                  <div className="w-3 h-3 border border-[#3a3a3e] border-t-[#9a9a9f] rounded-full animate-spin" />
                  <span>Profil wird geladen…</span>
                </div>
              ) : userProfile ? (
                <>
                  <div className="flex items-center gap-1 text-[11px] text-[#9a9a9f]">
                    <Users className="w-3 h-3" />
                    <span>{userProfile.friends.toLocaleString("de-DE")} Freunde</span>
                  </div>
                  <span className="text-[#3a3a3e]">·</span>
                  <div className="text-[11px] text-[#9a9a9f]">
                    Beigetreten {formatJoinAge(userProfile.created)}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-[#666668]">Profil nicht verfügbar</div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-5">
              <RobuxCoin size={26} />
              <span className="text-[28px] font-bold text-white">{getAmount().toLocaleString("de-DE")}</span>
            </div>

            <div className="flex gap-2 w-full mb-3">
              <button
                data-testid="button-send-gift"
                onClick={handleSend}
                disabled={sending || getAmount() < 1 || getAmount() > balance}
                className="flex-1 h-10 bg-[#4a8af4] hover:bg-[#3a7ae0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-full transition-all"
              >
                Send
              </button>
              <button
                onClick={() => setStep("amount")}
                disabled={sending}
                className="flex-1 h-10 bg-transparent border border-[#3a3a3e] hover:bg-[#252527] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-full transition-all"
              >
                Edit
              </button>
            </div>

            <p className="text-[10px] text-[#555557] text-center leading-relaxed px-2">
              You need an age check or parental consent to send Robux. Once you send, you cannot cancel.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
