import { useState } from "react";
import { Check } from "lucide-react";
import { useWalletContext } from "@/hooks/use-wallet-context";
import robuxIconUrl from "@assets/1000011212-removebg-preview_1781123352374.png";

const REDEEM_AMOUNTS = [1000, 10000, 15000, 20000, 25000, 50000, 100000];
const CODE_REGEX = /^[A-Z0-9]{2}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function RobuxIcon({ size = 16 }: { size?: number }) {
  return (
    <img
      src={robuxIconUrl}
      alt="R"
      className="invert shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

export default function Redeem() {
  const { balance, setBalance } = useWalletContext();
  const [code,     setCode]     = useState("");
  const [status,   setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [wonAmt,   setWonAmt]   = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  function formatCode(raw: string) {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const parts = [
      clean.slice(0, 2),
      clean.slice(2, 6),
      clean.slice(6, 10),
      clean.slice(10, 14),
      clean.slice(14, 18),
    ];
    return parts.filter(Boolean).join("-");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(formatCode(e.target.value));
    setStatus("idle");
    setErrorMsg("");
  }

  function handleRedeem() {
    if (!CODE_REGEX.test(code)) {
      setErrorMsg("Ungültiges Code-Format. Beispiel: M4-9KT4-1ZX6-9TT5-O4K8");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setTimeout(() => {
      const amount = REDEEM_AMOUNTS[Math.floor(Math.random() * REDEEM_AMOUNTS.length)];
      setWonAmt(amount);
      setBalance(balance + amount);
      setStatus("success");
    }, 1200);
  }

  return (
    <div className="px-4 md:px-8 pb-10 max-w-[720px]">

      {/* Header */}
      <div className="pt-6 pb-6">
        <h1 className="text-[26px] md:text-[30px] font-black text-white mb-1">
          Roblox-Codes einlösen
        </h1>
        <p className="text-[13px] text-[#9a9a9f]">
          Gib deinen Geschenkkartencode ein, um Robux zu erhalten.
        </p>
      </div>

      {/* Redeem card */}
      <div className="border border-[#2a2a2e] rounded-lg bg-[#111113] overflow-hidden max-w-[500px]">

        <div className="px-5 py-4 border-b border-[#2a2a2e] bg-[#1a1a1c]">
          <div className="text-[14px] font-bold text-white">Code einlösen</div>
          <div className="text-[12px] text-[#9a9a9f] mt-0.5">
            Gib deinen Geschenkkarten- oder Promo-Code ein
          </div>
        </div>

        <div className="px-5 py-5">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 py-3">
              <div className="w-14 h-14 rounded-full bg-[#1a3a1a] border border-[#2a6a2a] flex items-center justify-center">
                <Check className="h-7 w-7 text-[#4caf50]" />
              </div>
              <div className="text-center">
                <div className="text-[16px] font-bold text-white mb-1">Code eingelöst!</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[14px] text-[#9a9a9f]">Du hast erhalten:</span>
                  <RobuxIcon size={16} />
                  <span className="text-[14px] font-bold text-white">
                    {wonAmt.toLocaleString("de-DE")} Robux
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setCode(""); setStatus("idle"); }}
                className="text-[13px] text-[#4a8af4] hover:underline"
              >
                Weiteren Code einlösen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] text-[#9a9a9f] mb-1.5">
                  Code eingeben
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                  maxLength={22}
                  placeholder="M4-9KT4-1ZX6-9TT5-O4K8"
                  className={`w-full h-10 px-4 bg-[#1e1e20] border rounded-md text-[13px] text-white placeholder:text-[#555557] font-mono focus:outline-none transition-colors ${
                    status === "error" ? "border-[#e8273c]" : "border-[#3a3a3e] focus:border-[#4a8af4]"
                  }`}
                />
                {status === "error" && errorMsg && (
                  <p className="text-[12px] text-[#e8273c] mt-1.5">{errorMsg}</p>
                )}
              </div>

              <p className="text-[11px] text-[#555557]">
                Format: XX-XXXX-XXXX-XXXX-XXXX
              </p>

              <button
                onClick={handleRedeem}
                disabled={status === "loading" || code.length < 19}
                className="w-full h-10 bg-[#4a8af4] hover:bg-[#3a7ae0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-md transition-colors"
              >
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Einlösen…
                  </span>
                ) : "Einlösen"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="mt-5 max-w-[500px] p-4 border border-[#2a2a2e] rounded-lg bg-[#111113]">
        <h3 className="text-[13px] font-bold text-white mb-2">Wo finde ich meinen Code?</h3>
        <ul className="space-y-1.5">
          {[
            "Auf der Rückseite einer Roblox-Geschenkkarte",
            "In deiner E-Mail nach einem digitalen Kauf",
            "Auf einer Promo-Karte von einem Partner",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <RobuxIcon size={13} />
              <span className="text-[12px] text-[#9a9a9f]">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t border-[#2a2a2e] mt-10 pt-5">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
          {["Über uns", "Jobs", "Blog", "Eltern", "Geschenkgutscheine kaufen", "Hilfe"].map((l) => (
            <span key={l} className="text-[11px] text-[#9a9a9f] hover:text-white cursor-default transition-colors">
              {l}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-[#555557]">
          &copy;2026 Roblox Corporation
        </p>
      </div>
    </div>
  );
}
