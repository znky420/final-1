import { useState, useEffect } from "react";
import { getBrowserFingerprint } from "@/hooks/use-fingerprint";
import { KeysStore } from "@/lib/storage";
import robloxLogoUrl from "@assets/iconnnnn_1781185507450.png";

const KEY_STORAGE = "rxgft_access";

export function KeyGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY_STORAGE);
    if (!stored) { setStatus("invalid"); return; }
    try {
      const { key } = JSON.parse(stored) as { key: string };
      const hwid = getBrowserFingerprint();
      const result = KeysStore.validate(key, hwid);
      if (result.valid) {
        setStatus("valid");
      } else {
        localStorage.removeItem(KEY_STORAGE);
        setStatus("invalid");
      }
    } catch {
      setStatus("invalid");
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    const hwid = getBrowserFingerprint();
    const result = KeysStore.validate(trimmed, hwid);
    setLoading(false);
    if (result.valid) {
      localStorage.setItem(KEY_STORAGE, JSON.stringify({ key: trimmed.toUpperCase() }));
      setStatus("valid");
    } else {
      setError(result.reason ?? "Ungültiger Key");
      setKeyInput("");
    }
  }

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#111113] flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-[#4a8af4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "valid") return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#111113] flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">

        <div className="flex justify-center mb-8">
          <img src={robloxLogoUrl} alt="Roblox" className="h-16 w-16" style={{ mixBlendMode: "screen" }} />
        </div>

        <h1 className="text-center text-[22px] font-black text-white mb-1.5 tracking-tight">
          Zugang erforderlich
        </h1>
        <p className="text-center text-[13px] text-[#9a9a9f] mb-8 leading-snug">
          Gib deinen persönlichen Zugangscode ein<br />um fortzufahren.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={keyInput}
            onChange={(e) => {
              setError("");
              setKeyInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
            }}
            placeholder="RXGFT-XXXXX-XXXXX-XXXXX"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full h-12 px-4 bg-[#1e1e20] border border-[#3a3a3e] rounded-xl text-[13px] text-white placeholder:text-[#444446] focus:outline-none focus:border-[#4a8af4] text-center tracking-[0.15em] transition-colors font-mono uppercase"
          />

          {error && (
            <div className="flex items-center gap-2 bg-[#2a1a1a] border border-[#3a2a2a] rounded-lg px-3 py-2.5">
              <span className="text-[#e8273c] text-[18px] leading-none">✕</span>
              <p className="text-[12px] text-[#e8273c] font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !keyInput.trim()}
            className="w-full h-12 bg-[#4a8af4] hover:bg-[#3a7ae0] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-xl transition-colors"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Prüfen…</span>
              : "Zugang freischalten"
            }
          </button>
        </form>

        <p className="text-center text-[11px] text-[#444446] mt-8 leading-relaxed">
          Keys werden ausschließlich vom Administrator vergeben.<br />
          Jeder Key ist an ein Gerät gebunden.
        </p>
      </div>
    </div>
  );
}
