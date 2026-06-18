const STORAGE_KEY = "rxgft_hwid";

function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(36).padStart(8, "0");
}

export function getBrowserFingerprint(): string {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && cached.length > 4) return cached;
  } catch {}

  const parts: string[] = [
    navigator.userAgent,
    navigator.language ?? "",
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? 0),
    String((navigator as { deviceMemory?: number }).deviceMemory ?? 0),
    navigator.platform ?? "",
  ];

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = 200;
      canvas.height = 40;
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f6631d";
      ctx.fillRect(0, 0, 200, 40);
      ctx.fillStyle = "#069";
      ctx.fillText("Roblox🎮2026", 4, 12);
      ctx.fillStyle = "rgba(102,204,0,0.7)";
      ctx.fillText("HWID_LOCK", 4, 26);
      parts.push(canvas.toDataURL().slice(-40));
    }
  } catch {}

  const fp = [
    simpleHash(parts.slice(0, 3).join("|")),
    simpleHash(parts.slice(3).join("|")),
  ].join("-");

  try { localStorage.setItem(STORAGE_KEY, fp); } catch {}
  return fp;
}
