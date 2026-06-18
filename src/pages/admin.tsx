import { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, Plus, RefreshCw, LogOut, Shield, Users, Key, Edit2, Check, X, ImageIcon } from "lucide-react";
import { KeysStore, AccountsStore, StoredKey, StoredAccount } from "@/lib/storage";
import { fetchRobloxAvatar } from "@/lib/roblox-api";
import robloxLogoUrl from "@assets/iconnnnn_1781185507450.png";

const ADMIN_PASSWORD = "znky420";
const SESSION_KEY = "rxadm_v1";

function formatExpiry(expiresAt: string | null): { text: string; expired: boolean } {
  if (!expiresAt) return { text: "Unbegrenzt", expired: false };
  const d = new Date(expiresAt);
  const expired = d < new Date();
  return {
    text: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    expired,
  };
}

function formatCreated(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatBalance(n: number): string {
  return n.toLocaleString("de-DE");
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [tab, setTab] = useState<"keys" | "accounts">("keys");

  /* ── Keys state ── */
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [createLabel, setCreateLabel] = useState("");
  const [createExpiry, setCreateExpiry] = useState("7d");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  /* ── Accounts state ── */
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [accUsername, setAccUsername] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accError, setAccError] = useState("");
  const [accAvatarUrl, setAccAvatarUrl] = useState<string | null>(null);
  const [accAvatarLoading, setAccAvatarLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");

  const refreshKeys = useCallback(() => {
    setKeys(KeysStore.getAll());
  }, []);

  const refreshAccounts = useCallback(() => {
    setAccounts(AccountsStore.getAll());
  }, []);

  useEffect(() => {
    if (authed) {
      refreshKeys();
      refreshAccounts();
    }
  }, [authed, refreshKeys, refreshAccounts]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setPwError("Falsches Passwort");
      setPwInput("");
    }
  }

  /* ── Key actions ── */
  function handleCreateKey() {
    setCreating(true);
    setNewKey(null);
    const k = KeysStore.create(createLabel.trim(), createExpiry);
    setNewKey(k.key);
    setCreateLabel("");
    refreshKeys();
    setCreating(false);
  }

  function handleDeleteKey(id: string) {
    KeysStore.delete(id);
    refreshKeys();
    if (newKey) {
      const still = KeysStore.getAll().find((k) => k.key === newKey);
      if (!still) setNewKey(null);
    }
  }

  function handleResetKey(id: string) {
    KeysStore.resetHwidIp(id);
    refreshKeys();
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  /* ── Account actions ── */
  async function handleLoadAvatar() {
    const uname = accUsername.trim();
    if (uname.length < 2) { setAccError("Benutzernamen eingeben"); return; }
    setAccAvatarLoading(true);
    setAccError("");
    const result = await fetchRobloxAvatar(uname);
    setAccAvatarLoading(false);
    if (!result) {
      setAccAvatarUrl(null);
      setAccError("Roblox-Nutzer nicht gefunden");
    } else {
      setAccAvatarUrl(result.avatarUrl);
      if (!accUsername.trim()) setAccUsername(result.username);
    }
  }

  function handleCreateAccount() {
    const uname = accUsername.trim();
    if (uname.length < 3) { setAccError("Mindestens 3 Zeichen"); return; }
    const balNum = parseInt(accBalance, 10);
    if (isNaN(balNum) || balNum < 0) { setAccError("Gültige Balance eingeben"); return; }
    if (AccountsStore.getByUsername(uname)) { setAccError("Account existiert bereits"); return; }
    const acc: StoredAccount = {
      id: crypto.randomUUID(),
      username: uname,
      balance: balNum,
      avatarUrl: accAvatarUrl,
      isPremium: false,
      transactions: [],
    };
    AccountsStore.save(acc);
    setAccUsername("");
    setAccBalance("");
    setAccAvatarUrl(null);
    setAccError("");
    refreshAccounts();
  }

  function handleDeleteAccount(id: string) {
    AccountsStore.delete(id);
    refreshAccounts();
  }

  function startEdit(acc: StoredAccount) {
    setEditingId(acc.id);
    setEditBalance(String(acc.balance));
  }

  function saveEdit(id: string) {
    const b = parseInt(editBalance, 10);
    if (!isNaN(b) && b >= 0) {
      AccountsStore.updateBalance(id, b);
      refreshAccounts();
    }
    setEditingId(null);
  }

  /* ── Password gate ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center px-4">
        <div className="w-full max-w-[320px]">
          <div className="flex justify-center mb-5">
            <img src={robloxLogoUrl} alt="Roblox" className="h-12 w-12" style={{ mixBlendMode: "screen" }} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-[#e8273c]" />
            <h1 className="text-[20px] font-black text-white">Admin Panel</h1>
          </div>
          <p className="text-center text-[12px] text-[#555557] mb-6">Restricted Access</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(""); }}
              placeholder="Admin-Passwort"
              autoFocus
              className="w-full h-11 px-4 bg-[#1a1a1c] border border-[#3a3a3e] rounded-xl text-[14px] text-white placeholder:text-[#555557] focus:outline-none focus:border-[#4a8af4] transition-colors"
            />
            {pwError && <p className="text-[12px] text-[#e8273c] text-center">{pwError}</p>}
            <button type="submit" className="w-full h-11 bg-[#4a8af4] hover:bg-[#3a7ae0] text-white text-[14px] font-bold rounded-xl transition-colors">
              Einloggen
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeKeys  = keys.filter((k) => k.active && (!k.expiresAt || new Date(k.expiresAt) >= new Date()));
  const expiredKeys = keys.filter((k) => k.expiresAt && new Date(k.expiresAt) < new Date());

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">

      {/* Header */}
      <div className="bg-[#1a1a1c] border-b border-[#2a2a2e] sticky top-0 z-40">
        <div className="max-w-[900px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={robloxLogoUrl} alt="Roblox" className="h-7 w-7" style={{ mixBlendMode: "screen" }} />
            <span className="text-[15px] font-bold">Admin Panel</span>
            <span className="text-[10px] bg-[#e8273c] text-white px-2 py-0.5 rounded-full font-bold tracking-wide">RESTRICTED</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-[12px] text-[#9a9a9f]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#4caf50] rounded-full inline-block" />
                {activeKeys.length} Keys aktiv
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#4a8af4] rounded-full inline-block" />
                {accounts.length} Accounts
              </span>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
              className="flex items-center gap-1.5 text-[12px] text-[#9a9a9f] hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Abmelden
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[900px] mx-auto px-4 md:px-8 flex gap-1 pb-0">
          <button
            onClick={() => setTab("keys")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors ${tab === "keys" ? "border-[#4a8af4] text-white" : "border-transparent text-[#9a9a9f] hover:text-white"}`}
          >
            <Key className="h-3.5 w-3.5" /> Keys
          </button>
          <button
            onClick={() => setTab("accounts")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors ${tab === "accounts" ? "border-[#4a8af4] text-white" : "border-transparent text-[#9a9a9f] hover:text-white"}`}
          >
            <Users className="h-3.5 w-3.5" /> Accounts
          </button>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 md:px-8 py-6 space-y-5">

        {/* ── KEYS TAB ── */}
        {tab === "keys" && (
          <>
            {newKey && (
              <div className="bg-[#0f2a0f] border border-[#1a4a1a] rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] text-[#4caf50] font-bold uppercase tracking-wide mb-1">✓ Key erfolgreich erstellt</p>
                  <code className="text-[16px] font-mono font-bold text-white tracking-widest">{newKey}</code>
                </div>
                <button
                  onClick={() => copyText(newKey)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#4caf50] hover:bg-[#3d9943] text-white text-[12px] font-bold rounded-lg transition-colors shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === newKey ? "Kopiert!" : "Kopieren"}
                </button>
              </div>
            )}

            <div className="bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl p-5">
              <h2 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#4a8af4]" /> Neuen Key erstellen
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={createLabel}
                  onChange={(e) => setCreateLabel(e.target.value)}
                  placeholder="Bezeichnung (optional)"
                  className="flex-1 h-10 px-3 bg-[#111113] border border-[#3a3a3e] rounded-lg text-[13px] text-white placeholder:text-[#555557] focus:outline-none focus:border-[#4a8af4] transition-colors"
                />
                <select
                  value={createExpiry}
                  onChange={(e) => setCreateExpiry(e.target.value)}
                  className="h-10 px-3 bg-[#111113] border border-[#3a3a3e] rounded-lg text-[13px] text-white focus:outline-none focus:border-[#4a8af4] transition-colors cursor-pointer"
                >
                  <option value="1h">1 Stunde</option>
                  <option value="12h">12 Stunden</option>
                  <option value="1d">1 Tag</option>
                  <option value="3d">3 Tage</option>
                  <option value="7d">7 Tage</option>
                  <option value="30d">30 Tage</option>
                  <option value="never">Unbegrenzt</option>
                </select>
                <button
                  onClick={handleCreateKey}
                  disabled={creating}
                  className="flex items-center justify-center gap-2 px-5 h-10 bg-[#4a8af4] hover:bg-[#3a7ae0] disabled:opacity-50 text-white text-[13px] font-bold rounded-lg transition-colors shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Erstellen…" : "Erstellen"}
                </button>
              </div>
            </div>

            <div className="bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2e]">
                <h2 className="text-[14px] font-bold text-white">
                  Alle Keys <span className="text-[#9a9a9f] font-normal">({keys.length})</span>
                </h2>
                <button onClick={refreshKeys} className="p-1.5 text-[#9a9a9f] hover:text-white transition-colors rounded" title="Aktualisieren">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {keys.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-[#555557]">Noch keine Keys erstellt.</p>
                  <p className="text-[12px] text-[#444446] mt-1">Erstelle deinen ersten Key oben.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#222224]">
                  {[...keys].reverse().map((k) => {
                    const { text: expiryText, expired } = formatExpiry(k.expiresAt);
                    return (
                      <div key={k.id} className={`px-5 py-4 hover:bg-[#1e1e20] transition-colors ${expired ? "opacity-55" : ""}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <code className="text-[13px] md:text-[14px] font-mono font-bold text-white tracking-[0.12em]">{k.key}</code>
                              <button onClick={() => copyText(k.key)} className="text-[#555557] hover:text-white transition-colors" title="Key kopieren">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              {copied === k.key && <span className="text-[11px] text-[#4caf50] font-medium">Kopiert!</span>}
                              {k.label && (
                                <span className="text-[11px] bg-[#252527] border border-[#3a3a3e] px-2 py-0.5 rounded-full text-[#cccccc]">{k.label}</span>
                              )}
                              {expired && (
                                <span className="text-[11px] bg-[#3a1a1a] border border-[#4a2a2a] text-[#e8273c] px-2 py-0.5 rounded-full font-bold">ABGELAUFEN</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1">
                              <span className="text-[11px] text-[#9a9a9f]">
                                Ablauf: <span className={expired ? "text-[#e8273c]" : "text-[#cccccc]"}>{expiryText}</span>
                              </span>
                              <span className="text-[11px] text-[#9a9a9f]">
                                HWID: {k.hwid ? <span className="text-[#4caf50]">🔒 Gebunden</span> : <span className="text-[#f4a44a]">🔓 Offen</span>}
                              </span>
                              <span className="text-[11px] text-[#555557]">Erstellt: {formatCreated(k.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {k.hwid && (
                              <button onClick={() => handleResetKey(k.id)} title="HWID zurücksetzen" className="p-2 text-[#f4a44a] hover:text-white hover:bg-[#252527] rounded-lg transition-colors">
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => handleDeleteKey(k.id)} title="Key löschen" className="p-2 text-[#9a9a9f] hover:text-[#e8273c] hover:bg-[#2a1a1a] rounded-lg transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ACCOUNTS TAB ── */}
        {tab === "accounts" && (
          <>
            <div className="bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl p-5">
              <h2 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#4a8af4]" /> Neuen Account erstellen
              </h2>
              <div className="flex items-center gap-3 mb-3">
                {accAvatarUrl ? (
                  <img src={accAvatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-[#3a3a3e] shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#111113] border border-[#3a3a3e] flex items-center justify-center shrink-0">
                    <ImageIcon className="h-5 w-5 text-[#555557]" />
                  </div>
                )}
                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={accUsername}
                    onChange={(e) => { setAccUsername(e.target.value); setAccError(""); setAccAvatarUrl(null); }}
                    placeholder="Roblox Username"
                    className="flex-1 h-10 px-3 bg-[#111113] border border-[#3a3a3e] rounded-lg text-[13px] text-white placeholder:text-[#555557] focus:outline-none focus:border-[#4a8af4] transition-colors"
                  />
                  <button
                    onClick={handleLoadAvatar}
                    disabled={accAvatarLoading || accUsername.trim().length < 2}
                    title="Profilbild laden"
                    className="flex items-center justify-center gap-1.5 px-3 h-10 bg-[#252527] hover:bg-[#2f2f31] disabled:opacity-40 text-[#9a9a9f] hover:text-white text-[12px] font-semibold rounded-lg transition-colors shrink-0 border border-[#3a3a3e]"
                  >
                    {accAvatarLoading
                      ? <div className="w-3.5 h-3.5 border-2 border-[#3a3a3e] border-t-[#4a8af4] rounded-full animate-spin" />
                      : <ImageIcon className="h-3.5 w-3.5" />}
                    {accAvatarLoading ? "Lädt…" : "Avatar laden"}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  min={0}
                  value={accBalance}
                  onChange={(e) => { setAccBalance(e.target.value); setAccError(""); }}
                  placeholder="Balance (z.B. 50000)"
                  className="flex-1 h-10 px-3 bg-[#111113] border border-[#3a3a3e] rounded-lg text-[13px] text-white placeholder:text-[#555557] focus:outline-none focus:border-[#4a8af4] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={handleCreateAccount}
                  className="flex items-center justify-center gap-2 px-5 h-10 bg-[#4a8af4] hover:bg-[#3a7ae0] text-white text-[13px] font-bold rounded-lg transition-colors shrink-0"
                >
                  <Plus className="h-4 w-4" /> Erstellen
                </button>
              </div>
              {accError && <p className="text-[12px] text-[#e8273c] mt-2">{accError}</p>}
            </div>

            <div className="bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2e]">
                <h2 className="text-[14px] font-bold text-white">
                  Alle Accounts <span className="text-[#9a9a9f] font-normal">({accounts.length})</span>
                </h2>
                <button onClick={refreshAccounts} className="p-1.5 text-[#9a9a9f] hover:text-white transition-colors rounded" title="Aktualisieren">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[13px] text-[#555557]">Noch keine Accounts erstellt.</p>
                  <p className="text-[12px] text-[#444446] mt-1">Erstelle deinen ersten Account oben.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#222224]">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="px-5 py-4 hover:bg-[#1e1e20] transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {acc.avatarUrl ? (
                            <img src={acc.avatarUrl} alt={acc.username} className="w-9 h-9 rounded-full object-cover border border-[#3a3a3e] shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#2a2a2e] border border-[#3a3a3e] flex items-center justify-center shrink-0">
                              <span className="text-[14px] font-bold text-white">{acc.username.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-semibold text-white truncate">{acc.username}</span>
                              {acc.isPremium && <span className="text-[10px] text-[#ffc900]">★ Plus</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {editingId === acc.id ? (
                                <>
                                  <input
                                    type="number"
                                    min={0}
                                    value={editBalance}
                                    onChange={(e) => setEditBalance(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(acc.id); if (e.key === "Escape") setEditingId(null); }}
                                    className="w-32 h-6 px-2 bg-[#111113] border border-[#4a8af4] rounded text-[12px] text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button onClick={() => saveEdit(acc.id)} className="text-[#4caf50] hover:text-white transition-colors">
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="text-[#9a9a9f] hover:text-white transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-[12px] text-[#9a9a9f]">
                                    Balance: <span className="text-[#4a8af4] font-semibold">{formatBalance(acc.balance)} R$</span>
                                  </span>
                                  <button onClick={() => startEdit(acc)} className="text-[#555557] hover:text-white transition-colors" title="Balance bearbeiten">
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                            <span className="text-[10px] text-[#444446]">
                              {acc.transactions.length} Transaktionen
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          title="Account löschen"
                          className="p-2 text-[#9a9a9f] hover:text-[#e8273c] hover:bg-[#2a1a1a] rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
