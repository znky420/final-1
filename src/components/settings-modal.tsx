import { useState } from "react";
import { X, Crown } from "lucide-react";
import { useWalletContext } from "@/hooks/use-wallet-context";
import { AccountsStore } from "@/lib/storage";
import { fetchRobloxAvatar } from "@/lib/roblox-api";
import { SiRoblox } from "react-icons/si";

interface Props {
  open: boolean;
  onClose: () => void;
}


export function SettingsModal({ open, onClose }: Props) {
  const {
    balance, username, avatarUrl, isPremium,
    setUsername, setAvatarUrl, setBalance, setIsPremium, loadAccount,
  } = useWalletContext();

  const [inputValue, setInputValue] = useState(username);
  const [balanceInput, setBalanceInput] = useState(String(balance));
  const [error, setError] = useState("");
  const [balanceError, setBalanceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [accountLoaded, setAccountLoaded] = useState(false);

  async function handleSave() {
    let hasError = false;

    const newBalance = parseInt(balanceInput.replace(/\./g, "").replace(/,/g, ""), 10);
    if (isNaN(newBalance) || newBalance < 0) {
      setBalanceError("Gültige Zahl eingeben");
      hasError = true;
    } else {
      setBalanceError("");
    }

    const val = inputValue.trim();
    if (val.length < 3) {
      setError("Username muss mindestens 3 Zeichen haben");
      hasError = true;
    }

    if (hasError) return;

    setBalance(newBalance);

    // Admin account exists — load balance/transactions from store,
    // but always fetch avatar fresh from Roblox (independent of admin-stored avatar)
    const adminAccount = AccountsStore.getByUsername(val);
    if (adminAccount) {
      loadAccount(val);
      setLoading(true);
      try {
        const result = await fetchRobloxAvatar(val);
        if (result?.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
          setPreviewUrl(result.avatarUrl);
        }
      } finally {
        setLoading(false);
      }
      onClose();
      return;
    }

    // Fetch from Roblox API (new username or same without avatar)
    setLoading(true);
    setError("");
    try {
      const result = await fetchRobloxAvatar(val);
      if (result) {
        setUsername(result.username);
        setAvatarUrl(result.avatarUrl);
        setPreviewUrl(result.avatarUrl);
      } else {
        setUsername(val);
        setAvatarUrl(null);
        setPreviewUrl(null);
      }
      onClose();
    } catch {
      setUsername(val);
      setAvatarUrl(null);
      setPreviewUrl(null);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleUsernameChange(val: string) {
    setInputValue(val);
    setError("");
    setAccountLoaded(false);
    const acc = AccountsStore.getByUsername(val.trim());
    if (acc) {
      setBalanceInput(String(acc.balance));
      setPreviewUrl(acc.avatarUrl);
      setAccountLoaded(true);
    }
  }

  if (!open) return null;

  const displayChar = (username || "?").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[340px] bg-[#1e1e20] rounded-lg shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="text-[15px] font-bold text-white">Settings</span>
          <button onClick={onClose} className="text-[#9a9a9f] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">

          <div className="flex justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt={username} className="w-16 h-16 rounded-full object-cover border-2 border-[#3a3a3e]" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#3a3a3c] border-2 border-[#3a3a3e] flex items-center justify-center text-2xl font-bold text-white">
                {displayChar}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-[#9a9a9f] mb-1">Roblox Username</label>
            <input
              data-testid="input-roblox-username"
              type="text"
              value={inputValue}
              onChange={(e) => handleUsernameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full h-9 px-3 bg-[#2a2a2e] border border-[#3a3a3e] rounded text-[13px] text-white placeholder:text-[#666668] focus:outline-none focus:border-[#4a8af4] transition-colors"
            />
            {error && <p className="text-[11px] text-[#e8273c] mt-1">{error}</p>}
            {accountLoaded && (
              <p className="text-[10px] text-[#4caf50] mt-1">✓ Account gefunden — Balance wird geladen</p>
            )}
            {!accountLoaded && (
              <p className="text-[10px] text-[#555557] mt-1">
                Profilbild wird automatisch geladen.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-[#9a9a9f] mb-1">Robux Balance</label>
            <div className={`w-full h-9 px-3 bg-[#2a2a2e] border rounded flex items-center gap-2 transition-colors ${balanceError ? "border-[#e8273c]" : "border-[#3a3a3e] focus-within:border-[#4a8af4]"}`}>
              <div className="w-4 h-4 rounded-full bg-[#3a3a3c] border border-[#555557] flex items-center justify-center shrink-0">
                <SiRoblox className="h-2.5 w-2.5 text-white" />
              </div>
              <input
                data-testid="input-robux-balance"
                type="number"
                min={0}
                value={balanceInput}
                onChange={(e) => { setBalanceInput(e.target.value); setBalanceError(""); setAccountLoaded(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="bg-transparent text-[13px] text-white w-full focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="90000"
              />
            </div>
            {balanceError && <p className="text-[11px] text-[#e8273c] mt-1">{balanceError}</p>}
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-[#ffc900]" />
              <div>
                <div className="text-[13px] font-semibold text-white">Roblox Plus</div>
                <div className="text-[10px] text-[#555557]">Krone neben deinem Namen</div>
              </div>
            </div>
            <button
              onClick={() => setIsPremium(!isPremium)}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${isPremium ? "bg-[#4a8af4]" : "bg-[#3a3a3e]"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPremium ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <button
            data-testid="button-save-settings"
            onClick={handleSave}
            disabled={loading}
            className="w-full h-10 bg-[#4a8af4] hover:bg-[#3a7ae0] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded transition-colors"
          >
            {loading ? "Suchen..." : "Speichern"}
          </button>

        </div>
      </div>
    </div>
  );
}
