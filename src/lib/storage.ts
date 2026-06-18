export interface StoredAccount {
  id: string;
  username: string;
  balance: number;
  avatarUrl: string | null;
  isPremium: boolean;
  transactions: StoredTransaction[];
}

export interface StoredTransaction {
  id: string;
  type: "incoming" | "outgoing";
  amount: number;
  date: string;
  party: string;
  description: string;
}

export interface StoredKey {
  id: string;
  key: string;
  label: string;
  hwid: string | null;
  ip: string | null;
  expiresAt: string | null;
  createdAt: string;
  active: boolean;
}

export interface RecentRecipient {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastAmount: number;
  lastSentAt: string;
}

const ACCOUNTS_KEY = "rxgft_accounts_v1";
const KEYS_KEY = "rxgft_keys_v1";
const RECENT_KEY = "rxgft_recent_v1";
const MAX_RECENT = 5;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const AccountsStore = {
  getAll(): StoredAccount[] {
    return read<StoredAccount[]>(ACCOUNTS_KEY, []);
  },
  getByUsername(username: string): StoredAccount | null {
    const all = AccountsStore.getAll();
    return all.find((a) => a.username.toLowerCase() === username.toLowerCase()) ?? null;
  },
  save(account: StoredAccount) {
    const all = AccountsStore.getAll();
    const idx = all.findIndex((a) => a.id === account.id);
    if (idx >= 0) {
      all[idx] = account;
    } else {
      all.push(account);
    }
    write(ACCOUNTS_KEY, all);
  },
  delete(id: string) {
    const all = AccountsStore.getAll().filter((a) => a.id !== id);
    write(ACCOUNTS_KEY, all);
  },
  updateBalance(id: string, balance: number) {
    const all = AccountsStore.getAll();
    const acc = all.find((a) => a.id === id);
    if (acc) {
      acc.balance = balance;
      write(ACCOUNTS_KEY, all);
    }
  },
  updateTransactions(id: string, transactions: StoredTransaction[]) {
    const all = AccountsStore.getAll();
    const acc = all.find((a) => a.id === id);
    if (acc) {
      acc.transactions = transactions;
      write(ACCOUNTS_KEY, all);
    }
  },
  upsertFull(account: StoredAccount) {
    AccountsStore.save(account);
  },
};

export const KeysStore = {
  getAll(): StoredKey[] {
    return read<StoredKey[]>(KEYS_KEY, []);
  },
  save(key: StoredKey) {
    const all = KeysStore.getAll();
    const idx = all.findIndex((k) => k.id === key.id);
    if (idx >= 0) {
      all[idx] = key;
    } else {
      all.push(key);
    }
    write(KEYS_KEY, all);
  },
  delete(id: string) {
    const all = KeysStore.getAll().filter((k) => k.id !== id);
    write(KEYS_KEY, all);
  },
  resetHwidIp(id: string) {
    const all = KeysStore.getAll();
    const k = all.find((k) => k.id === id);
    if (k) {
      k.hwid = null;
      k.ip = null;
      write(KEYS_KEY, all);
    }
  },
  validate(keyStr: string, hwid: string): { valid: boolean; reason?: string } {
    const all = KeysStore.getAll();
    const k = all.find((k) => k.key === keyStr.trim().toUpperCase());
    if (!k) return { valid: false, reason: "Key nicht gefunden" };
    if (!k.active) return { valid: false, reason: "Key ist deaktiviert" };
    if (k.expiresAt && new Date(k.expiresAt) < new Date()) {
      return { valid: false, reason: "Key ist abgelaufen" };
    }
    if (k.hwid && k.hwid !== hwid) {
      return { valid: false, reason: "Key ist an ein anderes Gerät gebunden" };
    }
    if (!k.hwid) {
      k.hwid = hwid;
      write(KEYS_KEY, all);
    }
    return { valid: true };
  },
  generate(): string {
    const seg = () =>
      Math.random().toString(36).substring(2, 7).toUpperCase().replace(/[^A-Z0-9]/g, "X").padEnd(5, "X");
    return `RXGFT-${seg()}-${seg()}-${seg()}`;
  },
  create(label: string, expiresIn: string): StoredKey {
    const now = new Date();
    let expiresAt: string | null = null;
    if (expiresIn !== "never") {
      const ms: Record<string, number> = {
        "1h": 3600000,
        "12h": 43200000,
        "1d": 86400000,
        "3d": 259200000,
        "7d": 604800000,
        "30d": 2592000000,
      };
      if (ms[expiresIn]) {
        expiresAt = new Date(now.getTime() + ms[expiresIn]!).toISOString();
      }
    }
    const key: StoredKey = {
      id: crypto.randomUUID(),
      key: KeysStore.generate(),
      label,
      hwid: null,
      ip: null,
      expiresAt,
      createdAt: now.toISOString(),
      active: true,
    };
    KeysStore.save(key);
    return key;
  },
};

export const RecentStore = {
  getAll(): RecentRecipient[] {
    return read<RecentRecipient[]>(RECENT_KEY, []);
  },
  add(recipient: Omit<RecentRecipient, "lastSentAt"> & { lastSentAt?: string }) {
    const all = RecentStore.getAll().filter((r) => r.id !== recipient.id);
    all.unshift({ ...recipient, lastSentAt: recipient.lastSentAt ?? new Date().toISOString() });
    write(RECENT_KEY, all.slice(0, MAX_RECENT));
  },
};
