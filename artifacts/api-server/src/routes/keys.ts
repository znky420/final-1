import { Router } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const ADMIN_PASSWORD = "znky420";
const DATA_DIR = join(new URL(".", import.meta.url).pathname, "..", "..", "data");
const KEYS_FILE = join(DATA_DIR, "keys.json");

export interface AccessKey {
  id: string;
  key: string;
  label: string;
  hwid: string | null;
  ip: string | null;
  expiresAt: string | null;
  createdAt: string;
  active: boolean;
}

function loadKeys(): AccessKey[] {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(KEYS_FILE)) { writeFileSync(KEYS_FILE, "[]"); return []; }
    return JSON.parse(readFileSync(KEYS_FILE, "utf8")) as AccessKey[];
  } catch { return []; }
}

function saveKeys(keys: AccessKey[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

function generateKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `RXGFT-${seg(5)}-${seg(5)}-${seg(5)}`;
}

function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0]!.trim();
  return req.socket?.remoteAddress ?? "unknown";
}

function isAdmin(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  return req.headers["authorization"] === `Bearer ${ADMIN_PASSWORD}`;
}

const EXPIRY_MS: Record<string, number> = {
  "1h":  3_600_000,
  "12h": 43_200_000,
  "1d":  86_400_000,
  "3d":  259_200_000,
  "7d":  604_800_000,
  "30d": 2_592_000_000,
};

const router = Router();

/* ── POST /api/keys/validate ── */
router.post("/keys/validate", (req, res) => {
  const { key, hwid } = req.body as { key?: string; hwid?: string };
  if (!key || !hwid) {
    res.status(400).json({ valid: false, reason: "Fehlende Parameter" });
    return;
  }

  const keys = loadKeys();
  const entry = keys.find((k) => k.key === key.trim().toUpperCase() && k.active);

  if (!entry) {
    res.status(403).json({ valid: false, reason: "Ungültiger Key" });
    return;
  }

  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    res.status(403).json({ valid: false, reason: "Key abgelaufen" });
    return;
  }

  const clientIp = getClientIp(req as never);

  if (!entry.hwid && !entry.ip) {
    entry.hwid = hwid;
    entry.ip   = clientIp;
    saveKeys(keys);
    res.json({ valid: true, expiresAt: entry.expiresAt });
    return;
  }

  if (entry.hwid !== hwid) {
    res.status(403).json({ valid: false, reason: "Gerät nicht autorisiert (HWID gesperrt)" });
    return;
  }
  if (entry.ip !== clientIp) {
    res.status(403).json({ valid: false, reason: "IP-Adresse nicht autorisiert" });
    return;
  }

  res.json({ valid: true, expiresAt: entry.expiresAt });
});

/* ── GET /api/admin/keys ── */
router.get("/admin/keys", (req, res) => {
  if (!isAdmin(req as never)) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json({ keys: loadKeys() });
});

/* ── POST /api/admin/keys ── */
router.post("/admin/keys", (req, res) => {
  if (!isAdmin(req as never)) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { label = "", expiresIn } = req.body as { label?: string; expiresIn?: string };
  const duration = expiresIn ? EXPIRY_MS[expiresIn] : undefined;
  const expiresAt = duration ? new Date(Date.now() + duration).toISOString() : null;

  const newKey: AccessKey = {
    id:        randomBytes(8).toString("hex"),
    key:       generateKey(),
    label:     label.trim(),
    hwid:      null,
    ip:        null,
    expiresAt,
    createdAt: new Date().toISOString(),
    active:    true,
  };

  const keys = loadKeys();
  keys.push(newKey);
  saveKeys(keys);
  res.json({ key: newKey });
});

/* ── DELETE /api/admin/keys/:id ── */
router.delete("/admin/keys/:id", (req, res) => {
  if (!isAdmin(req as never)) { res.status(401).json({ error: "Unauthorized" }); return; }

  const keys = loadKeys();
  const idx = keys.findIndex((k) => k.id === req.params["id"]);
  if (idx === -1) { res.status(404).json({ error: "Nicht gefunden" }); return; }
  keys.splice(idx, 1);
  saveKeys(keys);
  res.json({ ok: true });
});

/* ── POST /api/admin/keys/:id/reset  (unlock HWID+IP) ── */
router.post("/admin/keys/:id/reset", (req, res) => {
  if (!isAdmin(req as never)) { res.status(401).json({ error: "Unauthorized" }); return; }

  const keys = loadKeys();
  const entry = keys.find((k) => k.id === req.params["id"]);
  if (!entry) { res.status(404).json({ error: "Nicht gefunden" }); return; }
  entry.hwid = null;
  entry.ip   = null;
  saveKeys(keys);
  res.json({ ok: true });
});

export default router;
