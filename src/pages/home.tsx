import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import robuxIconUrl from "@assets/1000011212-removebg-preview_1781123352374.png";
import robloxLogoUrl from "@assets/iconnnnn_1781185507450.png";
import dominoGif from "@assets/fc4144c0da5886db_1781704549368.gif";
import wingsGif from "@assets/ffbafc561496147e_1781704549419.gif";
import verifiedBadgeUrl from "@assets/Roblox_Verified_Badge_1781805120298.png";
import { useWalletContext } from "@/hooks/use-wallet-context";

const FEATURED = { total: 2000, base: 1700, price: "23,99 €" };

const PACKAGE_ROWS = [
  { total: 24000, base: 22500, price: "239,99 €" },
  { total: 11000, base: 10000, price: "119,99 €" },
  { total: 5250,  base: 4500,  price: "59,99 €"  },
  { total: 3625,  base: 3150,  price: "39,99 €"  },
  { total: 1500,  base: 1200,  price: "17,99 €"  },
  { total: 1000,  base: 800,   price: "11,99 €"  },
  { total: 500,   base: 400,   price: "5,99 €"   },
];

const PLUS_CARDS = [
  {
    name: "Roblox Plus",
    oldPrice: null,
    price: "5,99 €",
    features: [
      "10 % Rabatt auf In-Game-Artikel, Avatare und mehr",
      "Kostenlose private Server",
      "Robux kostenlos senden",
    ],
    monthly: "5,99 €/month",
    primary: false,
  },
  {
    name: "Plus 500",
    oldPrice: "11,98 €",
    price: "10,99 €",
    features: [
      "Alles in Plus",
      "+500 Robux jeden Monat",
      "11,98 € Gesamtwert",
    ],
    monthly: "10,99 €/month",
    primary: false,
  },
  {
    name: "Plus 1000",
    oldPrice: "17,98 €",
    price: "15,99 €",
    features: [
      "Alles in Plus",
      "+1.000 Robux jeden Monat",
      "17,98 € Gesamtwert",
    ],
    monthly: "15,99 €/month",
    primary: false,
  },
];

const FAQ_ITEMS = [
  "Was sind Robux?",
  "Wo sind meine Robux?",
  "Verfallen Robux?",
  "Wie kannst du deine Geschenkkarte einlösen?",
];

const fmt = (n: number) => n.toLocaleString("de-DE");

function RobuxIcon({ size = 18 }: { size?: number }) {
  return (
    <img
      src={robuxIconUrl}
      alt="R"
      className="invert shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

function PricingPackageRow({ total, base, price }: { total: number; base: number; price: string }) {
  return (
    <div className="flex items-center px-4 md:px-5 py-3 border-b border-[#2a2a2e] last:border-b-0 hover:bg-[#1e1e20] transition-colors cursor-default select-none">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <RobuxIcon size={17} />
        <span className="text-[14px] md:text-[15px] font-bold text-white">{fmt(total)}</span>
        <div className="flex items-center gap-1 ml-1">
          <RobuxIcon size={12} />
          <span className="text-[11px] text-[#9a9a9f] line-through">{fmt(base)}</span>
        </div>
      </div>
      <span className="text-[13px] text-[#cccccc] font-medium shrink-0 ml-3 bg-[#252527] px-3 py-1.5 rounded-md w-[90px] text-center">
        {price}
      </span>
    </div>
  );
}

function FaqItem({ question }: { question: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-[#2a2a2e] last:border-b-0 cursor-pointer hover:bg-[#1e1e20] transition-colors select-none"
      onClick={() => setOpen(!open)}
    >
      <span className="text-[13px] md:text-[14px] text-white">{question}</span>
      {open ? (
        <ChevronUp className="h-4 w-4 text-[#9a9a9f] shrink-0 ml-2" />
      ) : (
        <ChevronDown className="h-4 w-4 text-[#9a9a9f] shrink-0 ml-2" />
      )}
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const { balance } = useWalletContext();

  return (
    <div className="px-4 md:px-8 pb-8 md:pb-14 max-w-[760px]">

      {/* Full-bleed hero section with warp grid */}
      <div className="relative -mx-4 md:-mx-8 px-4 md:px-8 overflow-hidden pb-6">
        {/* Warp grid — edge to edge */}
        <svg
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.12 }}
        >
          <defs>
            <pattern id="warp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="1" />
            </pattern>
            <filter id="warp-filter">
              <feTurbulence type="fractalNoise" baseFrequency="0.003" numOctaves="1" seed="5" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#warp-grid)" filter="url(#warp-filter)" />
        </svg>

        {/* Balance + Senden row */}
        <div className="relative flex items-center justify-between gap-3 pt-3 pb-1">
          <div className="flex items-center gap-1.5 bg-[#1e1e20] border border-[#3a3a3e] rounded-full px-3 py-1.5">
            <RobuxIcon size={15} />
            <span className="text-[13px] font-bold text-white">{balance.toLocaleString("de-DE")}</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event("open-send"))}
            className="relative flex items-center gap-2 px-3 py-1.5 bg-[#323234] hover:bg-[#3e3e40] text-white text-[13px] font-bold rounded-[8px] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M4 20h16"/>
            </svg>
            Senden
          </button>
        </div>

        {/* Hero text — Robux on its own third line */}
        <div className="relative pt-4 pb-1 md:pb-2">
          <h1 className="text-[22px] sm:text-[38px] md:text-[44px] font-black text-white leading-tight">
            Sichere dir bis zu 25 %<br />mehr<br />Robux
          </h1>
        </div>
      </div>

      {/* Zeitlich begrenzte Avatarartikel */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 className="text-[18px] font-black text-white leading-tight">
            Zeitlich begrenzte<br />Avatarartikel
          </h2>
          {/* Badge: solid white background, dark text */}
          <span className="shrink-0 mt-0.5 text-[12px] font-semibold text-black border border-white rounded-full px-3 py-1 bg-white whitespace-nowrap">
            Noch 15 Tage
          </span>
        </div>

        {/* Card 1 — Gesplitterte Dominokrone */}
        <div className="border border-[#333336] rounded-2xl bg-[#232325] mb-3 overflow-hidden">
          <div className="flex items-center gap-3 px-3 pt-3 pb-3">
            {/* GIF frei, kein Kasten */}
            <img src={dominoGif} alt="Gesplitterte Dominokrone" className="w-[90px] h-[90px] shrink-0 object-contain" />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[15px] font-bold text-white leading-snug">Gesplitterte<br />Dominokrone</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[13px] font-medium text-white">Roblox</span>
                <img src={verifiedBadgeUrl} alt="Verified" className="w-[18px] h-[18px] shrink-0" />
              </div>
            </div>
          </div>
          <div className="flex items-center px-3 pt-3 pb-3 gap-2 bg-[#2b2b2d]">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <RobuxIcon size={15} />
              <span className="text-[14px] font-bold text-white">24.000</span>
              <div className="flex items-center gap-1 ml-1">
                <RobuxIcon size={11} />
                <span className="text-[12px] text-[#888890] line-through">22.500</span>
              </div>
            </div>
            <span className="shrink-0 text-[13px] font-semibold text-white bg-[#3a3a3c] px-5 py-[7px] rounded-lg">
              239,99 €
            </span>
          </div>
        </div>

        {/* Card 2 — Flügel des Paktbrechers */}
        <div className="border border-[#333336] rounded-2xl bg-[#232325] overflow-hidden">
          <div className="flex items-center gap-3 px-3 pt-3 pb-3">
            {/* GIF frei, kein Kasten */}
            <img src={wingsGif} alt="Flügel des Paktbrechers" className="w-[90px] h-[90px] shrink-0 object-contain" />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[15px] font-bold text-white leading-snug">Flügel des<br />Paktbrechers</span>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[13px] font-medium text-white">Roblox</span>
                <img src={verifiedBadgeUrl} alt="Verified" className="w-[18px] h-[18px] shrink-0" />
              </div>
            </div>
          </div>
          <div className="flex items-center px-3 pt-3 pb-3 gap-2 bg-[#2b2b2d]">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <RobuxIcon size={15} />
              <span className="text-[14px] font-bold text-white">11.000</span>
              <div className="flex items-center gap-1 ml-1">
                <RobuxIcon size={11} />
                <span className="text-[12px] text-[#888890] line-through">10.000</span>
              </div>
            </div>
            <span className="shrink-0 text-[13px] font-semibold text-white bg-[#3a3a3c] px-5 py-[7px] rounded-lg">
              119,99 €
            </span>
          </div>
        </div>
      </div>

      {/* Robux-Pakete */}
      <div className="mb-6">
        <h2 className="text-[15px] md:text-[16px] font-bold text-white mb-1">Robux-Pakete</h2>
        <p className="text-[12px] text-[#9a9a9f] mb-3">
          Durch den Kauf von Robux erklärst du dich mit unseren{" "}
          <span className="text-white font-semibold">Nutzungsbedingungen</span>, einschließlich der{" "}
          <span className="text-white font-semibold">Schiedsklausel</span> und der{" "}
          <span className="text-white font-semibold">Widerrufsbelehrung</span>, einverstanden.
        </p>
        <div className="border border-[#2a2a2e] rounded-xl bg-[#111113]">
          {PACKAGE_ROWS.map((row) => (
            <PricingPackageRow key={row.total} {...row} />
          ))}
        </div>
      </div>

      {/* Neu auf Roblox */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Roblox logo icon instead of yellow circle */}
            <img src={robloxLogoUrl} alt="Roblox" className="w-5 h-5 shrink-0" style={{ mixBlendMode: "screen" }} />
            <h2 className="text-[15px] md:text-[16px] font-bold text-white">Neu auf Roblox</h2>
          </div>
          <span className="text-[12px] text-[#cccccc] hover:underline cursor-default">Mehr erfahren</span>
        </div>

        {/* Cards — horizontal scroll on mobile, 3-col on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
          {PLUS_CARDS.map((card) => (
            <div
              key={card.name}
              className="min-w-[200px] md:min-w-0 bg-[#1f1f21] border border-[#2a2a2e] rounded-lg p-4 flex flex-col"
            >
              <div className="flex items-start justify-between mb-0.5">
                <span className="text-[13px] font-bold text-white">{card.name}</span>
                <span className="text-[13px] font-semibold text-white ml-2 shrink-0">
                  {card.price}
                </span>
              </div>
              {card.oldPrice && (
                <span className="text-[11px] text-[#9a9a9f] line-through mb-2">{card.oldPrice}</span>
              )}
              <div className="space-y-2 mb-3 flex-1">
                {card.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center">
                      <img src={robuxIconUrl} alt="" className="w-3.5 h-3.5 invert opacity-60" />
                    </div>
                    <span className="text-[11px] text-[#9a9a9f] leading-snug">{f}</span>
                  </div>
                ))}
              </div>
              <button
                className="w-full py-2 text-[12px] font-bold rounded transition-colors cursor-default bg-[#252527] text-white hover:bg-[#2e2e30]"
              >
                {card.monthly}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-6">
        <h2 className="text-[15px] md:text-[16px] font-bold text-white mb-3">FAQ</h2>
        <div className="border border-[#2a2a2e] rounded-xl bg-[#111113]">
          {FAQ_ITEMS.map((q) => (
            <FaqItem key={q} question={q} />
          ))}
        </div>
      </div>

      {/* Legal */}
      <p className="text-[10px] text-[#555557] leading-relaxed mb-6 max-w-[660px]">
        Wenn du Robux kaufst, erhältst du eine eingeschränkte, nicht erstattungsfähige, nicht übertragbare, widerrufliche Lizenz zur Nutzung von Robux, die keinen Wert in realer Währung hat. Wenn du das Plus-Abopaket auswählst, (1) bestätigst du, dass du über 18 Jahre alt bist und ermächtigst uns, dein Konto jeden Monat zu belasten, bis du das Abo kündigst. Außerdem (2) bestätigst du, dass du die Nutzungsbedingungen akzeptiert hast, die eine Schiedsvereinbarung bei Streitigkeiten enthält, und die Datenschutzrichtlinie verstehst und diesen zustimmst. Du kannst das Abo jederzeit kündigen, indem du auf der Einstellungsseite unter Zahlungen auf „Abo kündigen" klickst.
      </p>

      {/* Footer */}
      <div className="border-t border-[#2a2a2e] pt-5">
        <div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-1.5 mb-4">
          {[
            "Über uns", "Jobs", "Blog", "Eltern", "Geschenkgutscheine kaufen",
            "Hilfe", "Bedingungen", "Barrierefreiheit", "Datenschutz", "Deine Datenschutzoptionen",
            "Sitemap", "Cookie-Optionen",
          ].map((l) => (
            <span key={l} className="text-[11px] text-[#9a9a9f] hover:text-white cursor-default transition-colors">
              {l}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-[#555557]">
          &copy;2026 Roblox Corporation. Roblox, das Roblox-Logo und „Powering Imagination" gehören zu unseren eingetragenen und nicht eingetragenen Markenzeichen in den USA und anderen Ländern.
        </p>
      </div>

    </div>
  );
}
