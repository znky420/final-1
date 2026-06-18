import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Settings, Search, Menu } from "lucide-react";
import { useWalletContext } from "@/hooks/use-wallet-context";
import { SendModal } from "@/components/send-modal";
import { SettingsModal } from "@/components/settings-modal";
import { SearchBar, MobileSearchOverlay } from "@/components/search-bar";
import robuxIconUrl from "@assets/1000011212-removebg-preview_1781123352374.png";
import robloxLogoUrl from "@assets/iconnnnn_1781185507450.png";

const NAV_LINKS = [
  { label: "Charts",     path: "#" },
  { label: "Marktplatz", path: "#" },
  { label: "Erstellen",  path: "#" },
  { label: "Robux",      path: "/" },
];

function UserAvatar({ size = 24 }: { size?: number }) {
  const { username, avatarUrl } = useWalletContext();
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
      className="rounded-full bg-white flex items-center justify-center shrink-0 font-bold uppercase"
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.38), color: "#1a1a1c" }}
    >
      {(username || "?").charAt(0)}
    </div>
  );
}

function RobuxDropdown({ onClose }: { onClose: () => void }) {
  const { balance } = useWalletContext();
  const [, navigate] = useLocation();

  function go(path: string) {
    onClose();
    navigate(path);
  }

  return (
    <div className="bg-[#1e1e20] rounded-lg shadow-2xl overflow-hidden min-w-[220px]">
      {/* Balance row — only a very thin separator below */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <img src={robuxIconUrl} alt="R" className="w-4 h-4 invert shrink-0" />
        <span className="text-[15px] font-bold text-white">{balance.toLocaleString("de-DE")}</span>
      </div>

      {/* Robux kaufen — "Neuer Artikel" small square badge, no separator below */}
      <button
        onClick={() => go("/")}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-[#cccccc] hover:bg-[#252527] hover:text-white transition-colors"
      >
        <span>Robux kaufen</span>
        <span className="ml-3 shrink-0 text-[11px] font-semibold bg-white text-black px-1.5 py-0.5 rounded-sm leading-tight">
          Neuer Artikel
        </span>
      </button>

      {/* Other items — no separators */}
      <button
        onClick={() => go("/transactions")}
        className="w-full text-left px-4 py-3 text-[13px] text-[#cccccc] hover:bg-[#252527] hover:text-white transition-colors"
      >
        Meine Transaktionen
      </button>
      <button
        onClick={() => go("/redeem")}
        className="w-full text-left px-4 py-3 text-[13px] text-[#cccccc] hover:bg-[#252527] hover:text-white transition-colors"
      >
        Roblox-Codes einlösen
      </button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { username } = useWalletContext();
  const [sendOpen,         setSendOpen]         = useState(false);
  const [settingsOpen,     setSettingsOpen]     = useState(false);
  const [robuxDropOpen,    setRobuxDropOpen]    = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const robuxRef = useRef<HTMLDivElement>(null);
  const [location, navigate] = useLocation();

  useEffect(() => {
    function handleOpenSend() { setSendOpen(true); }
    window.addEventListener("open-send", handleOpenSend);
    return () => window.removeEventListener("open-send", handleOpenSend);
  }, []);

  useEffect(() => {
    if (!robuxDropOpen) return;
    function handleClick(e: MouseEvent) {
      if (robuxRef.current && !robuxRef.current.contains(e.target as Node)) setRobuxDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [robuxDropOpen]);

  return (
    <div className="min-h-screen bg-[#111113] text-white flex flex-col">

      {/* ── Navigation Bar ── */}
      <nav className="bg-[#1f1f21] border-b border-[#2a2a2e] sticky top-0 z-50 shrink-0">

        <div className="flex items-center h-[52px] md:h-[48px] px-2 md:px-4 gap-1">

          <button className="p-2 text-white hover:text-white transition-colors shrink-0">
            <Menu className="h-5 w-5" />
          </button>

          <button
            onClick={() => navigate("/")}
            className="shrink-0 p-1 hover:opacity-80 transition-opacity"
          >
            <img src={robloxLogoUrl} alt="Roblox" className="h-8 w-8" style={{ mixBlendMode: "screen" }} />
          </button>

          <div className="hidden md:flex flex-1 px-4 max-w-[520px]">
            <SearchBar />
          </div>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center shrink-0">

            {/* Avatar + username */}
            <div className="flex items-center gap-2 px-2 cursor-default select-none">
              <UserAvatar size={28} />
              <span className="hidden md:block text-[13px] font-medium text-[#cccccc] max-w-[110px] truncate">
                {username}
              </span>
            </div>

            {/* Search icon — mobile */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 text-white transition-colors shrink-0"
            >
              <Search className="h-[19px] w-[19px]" />
            </button>

            {/* Robux icon + dropdown */}
            <div className="relative" ref={robuxRef}>
              <button
                onClick={() => setRobuxDropOpen((v) => !v)}
                className="p-2 text-white transition-colors rounded"
              >
                <img src={robuxIconUrl} alt="Robux" className="h-[19px] w-[19px] invert" />
              </button>
              {robuxDropOpen && (
                <>
                  <div className="md:hidden fixed inset-x-3 top-[96px] z-[300]">
                    <RobuxDropdown onClose={() => setRobuxDropOpen(false)} />
                  </div>
                  <div className="hidden md:block absolute right-0 top-full mt-1 z-[300]">
                    <RobuxDropdown onClose={() => setRobuxDropOpen(false)} />
                  </div>
                </>
              )}
            </div>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-white transition-colors"
            >
              <Settings className="h-[19px] w-[19px]" />
            </button>
          </div>
        </div>

        {/* Row 2: nav links */}
        <div className="flex border-t border-[#2a2a2e] overflow-x-auto scrollbar-none">
          {NAV_LINKS.map(({ label, path }) => {
            const isActive = path === "/" ? location === "/" : location.startsWith(path);
            return (
              <button
                key={label}
                onClick={() => { if (path !== "#") navigate(path); }}
                className={`px-5 md:px-6 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors shrink-0 border-b-2 ${
                  isActive
                    ? "text-white border-[#4a8af4]"
                    : "text-white border-transparent hover:bg-[#252527]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[960px] mx-auto">
          {children}
        </div>
      </main>

      {mobileSearchOpen && (
        <MobileSearchOverlay onClose={() => setMobileSearchOpen(false)} />
      )}

      <SendModal open={sendOpen} onClose={() => setSendOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
