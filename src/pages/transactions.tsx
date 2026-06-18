import { useState, useMemo } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { useWalletContext, type Transaction } from "@/hooks/use-wallet-context";
import robuxIconUrl from "@assets/1000011212-removebg-preview_1781123352374.png";

const TRANSACTION_TYPES = ["Zusammenfassung", "Eingehend", "Ausgehend"];
const TIME_RANGES = ["Vorheriger Tag", "Letzte 7 Tage", "Letzte 30 Tage", "Letztes Jahr"];

function RobuxIcon({ size = 16, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <img
      src={robuxIconUrl}
      alt="R"
      className="shrink-0"
      style={{ width: size, height: size, filter: muted ? "invert(1) opacity(0.4)" : "invert(1)" }}
    />
  );
}

function SelectBox({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <label className="block text-[13px] text-[#9a9a9f] mb-1.5">{label}</label>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-3 border rounded-md text-[14px] text-white bg-[#111113] transition-colors ${
            open ? "border-[#4a8af4]" : "border-[#3a3a3e] hover:border-[#555557]"
          }`}
        >
          <span>{value}</span>
          <ChevronDown className={`h-4 w-4 text-[#9a9a9f] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 w-full bg-[#1e1e20] border border-[#3a3a3e] rounded-md shadow-xl z-50 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-3 text-[14px] transition-colors border-b border-[#2a2a2e] last:border-b-0 ${
                  opt === value ? "bg-[#252527] text-white font-semibold" : "text-[#cccccc] hover:bg-[#252527] hover:text-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getTimeRangeCutoff(range: string): Date {
  const now = new Date();
  switch (range) {
    case "Vorheriger Tag": return new Date(now.getTime() - 86400000);
    case "Letzte 7 Tage":  return new Date(now.getTime() - 7 * 86400000);
    case "Letzte 30 Tage": return new Date(now.getTime() - 30 * 86400000);
    case "Letztes Jahr":   return new Date(now.getTime() - 365 * 86400000);
    default: return new Date(0);
  }
}

/* ── Summary row ── */
function SummaryRow({
  label, amount, prefix = "", muted = false, icon,
}: {
  label: string; amount: number; prefix?: string; muted?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-[#2a2a2e] last:border-b-0 ${muted ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 text-[14px] text-white">
        <span>{label}</span>
        {icon}
      </div>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-[14px] text-white">{prefix}</span>}
        <RobuxIcon size={15} muted={muted} />
        <span className="text-[14px] text-white">{amount.toLocaleString("de-DE")}</span>
      </div>
    </div>
  );
}

/* ── Individual transaction row ── */
function TxRow({ tx }: { tx: Transaction }) {
  const isIn = tx.type === "incoming";
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#2a2a2e] last:border-b-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
          isIn ? "bg-[#1a3a1a] text-[#4caf50]" : "bg-[#3a1a1a] text-[#e8273c]"
        }`}>
          {isIn ? "+" : "−"}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white truncate">{tx.description}</div>
          <div className="text-[11px] text-[#9a9a9f] truncate">{tx.party}</div>
          <div className="text-[10px] text-[#555557] mt-0.5">{formatDate(tx.date)}</div>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 shrink-0 ${isIn ? "text-[#4caf50]" : "text-[#e8273c]"}`}>
        <span className="text-[13px] font-bold">{isIn ? "+" : "−"}</span>
        <RobuxIcon size={13} />
        <span className="text-[13px] font-bold">{tx.amount.toLocaleString("de-DE")}</span>
      </div>
    </div>
  );
}

/* Generate realistic-looking Robux summary amounts per session */
function genSummaryAmounts() {
  function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  // Occasionally a huge amount (20% chance)
  const isBig = Math.random() < 0.2;
  const waehrung = isBig ? rand(3_000_000, 55_000_000) : rand(400_000, 2_800_000);
  // Warenverkauf smaller portion
  const waren = Math.floor(waehrung * (Math.random() * 0.35 + 0.08));
  // Ausstehend always 0 (pending)
  const ausstehend = 0;
  // Outgoing: realistic purchase count
  const kaeufe = rand(2, 18);
  const kaufTotal = rand(150, Math.min(waehrung, 450_000));
  return { waehrung, waren, ausstehend, inTotal: waehrung + waren, kaeufe, kaufTotal };
}

export default function Transactions() {
  const { balance, transactions } = useWalletContext();
  const [txType, setTxType]       = useState(TRANSACTION_TYPES[0]!);
  const [timeRange, setTimeRange] = useState(TIME_RANGES[2]!);

  // Stable per mount so numbers don't flicker on re-render
  const summary = useMemo(genSummaryAmounts, []);

  const cutoff = useMemo(() => getTimeRangeCutoff(timeRange), [timeRange]);

  const filtered = useMemo(() => transactions.filter((tx) => {
    if (tx.date < cutoff) return false;
    if (txType === "Eingehend")  return tx.type === "incoming";
    if (txType === "Ausgehend")  return tx.type === "outgoing";
    return true;
  }), [transactions, cutoff, txType]);

  const incoming = filtered.filter((t) => t.type === "incoming");
  const outgoing = filtered.filter((t) => t.type === "outgoing");
  const totalOut = outgoing.reduce((s, t) => s + t.amount, 0);

  const isSummary = txType === "Zusammenfassung";

  return (
    <div className="px-4 md:px-8 pb-10 max-w-[720px]">

      {/* Filters */}
      <div className="pt-5">
        <SelectBox label="Art der Transaktion" value={txType} options={TRANSACTION_TYPES} onChange={setTxType} />
        <SelectBox label="Zeitspanne" value={timeRange} options={TIME_RANGES} onChange={setTimeRange} />
      </div>

      {/* ── SUMMARY VIEW ── */}
      {isSummary && (
        <>
          <h2 className="text-[18px] font-bold text-white mb-4">Zusammenfassung</h2>

          {/* Incoming section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-bold text-white">Eingehende Robux</span>
              <span className="text-[13px] font-bold text-white">Betrag</span>
            </div>
            <div className="border-t border-[#3a3a3e]">
              <SummaryRow label="Währungskäufe" amount={summary.waehrung} />
              <SummaryRow label="Warenverkauf" amount={summary.waren} />
              <SummaryRow
                label="Ausstehende Robux"
                amount={summary.ausstehend}
                muted
                icon={<Clock className="h-3.5 w-3.5 text-[#9a9a9f]" />}
              />
              <SummaryRow label="Gesamtbetrag" amount={summary.inTotal} />
            </div>
          </div>

          {/* Outgoing section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-bold text-white">Ausgehende Robux</span>
              <span className="text-[13px] font-bold text-white">Betrag</span>
            </div>
            <div className="border-t border-[#3a3a3e]">
              <SummaryRow label="Käufe" amount={summary.kaeufe + outgoing.length} prefix="-" />
              <SummaryRow label="Gesamtbetrag" amount={summary.kaufTotal + totalOut} prefix="-" />
            </div>
          </div>
        </>
      )}

      {/* ── DETAIL VIEWS ── */}
      {!isSummary && (
        <>
          {(txType === "Alle" || txType === "Eingehend") && (
            <div className="mb-6">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#3a3a3e] mb-0">
                <span className="text-[13px] font-bold text-white">Eingehende Robux</span>
                <span className="text-[12px] text-[#9a9a9f]">{incoming.length} Einträge</span>
              </div>
              {incoming.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#555557]">
                  Keine eingehenden Transaktionen im gewählten Zeitraum.
                </div>
              ) : (
                incoming.map((tx) => <TxRow key={tx.id} tx={tx} />)
              )}
            </div>
          )}

          {(txType === "Alle" || txType === "Ausgehend") && (
            <div className="mb-6">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#3a3a3e] mb-0">
                <span className="text-[13px] font-bold text-white">Ausgehende Robux</span>
                <span className="text-[12px] text-[#9a9a9f]">{outgoing.length} Einträge</span>
              </div>
              {outgoing.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-[#555557]">
                  Noch keine Robux gesendet.
                </div>
              ) : (
                outgoing.map((tx) => <TxRow key={tx.id} tx={tx} />)
              )}
            </div>
          )}
        </>
      )}

      {/* Balance strip */}
      <div className="flex items-center gap-2 py-3 border-t border-[#2a2a2e] mt-2">
        <span className="text-[13px] text-[#9a9a9f]">Kontostand:</span>
        <RobuxIcon size={14} />
        <span className="text-[14px] font-bold text-white">{balance.toLocaleString("de-DE")}</span>
      </div>

      {/* Footer */}
      <div className="border-t border-[#2a2a2e] pt-5 mt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
          {["Über uns", "Jobs", "Blog", "Eltern", "Geschenkgutscheine kaufen", "Hilfe"].map((l) => (
            <span key={l} className="text-[11px] text-[#9a9a9f] hover:text-white cursor-default transition-colors">{l}</span>
          ))}
        </div>
        <p className="text-[10px] text-[#555557]">&copy;2026 Roblox Corporation</p>
      </div>
    </div>
  );
}
