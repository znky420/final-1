import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { AccountsStore, StoredTransaction } from "@/lib/storage";
import { fetchRobloxAvatar } from "@/lib/roblox-api";

export interface Transaction {
  id: string;
  type: "incoming" | "outgoing";
  amount: number;
  date: Date;
  party: string;
  description: string;
}

interface WalletContextType {
  balance: number;
  username: string;
  avatarUrl: string | null;
  isPremium: boolean;
  transactions: Transaction[];
  activeAccountId: string | null;
  setBalance: (balance: number) => void;
  setUsername: (username: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setIsPremium: (v: boolean) => void;
  deduct: (amount: number) => boolean;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  loadAccount: (username: string) => boolean;
}

const WalletContext = createContext<WalletContextType>({
  balance: 90000,
  username: "NoUser",
  avatarUrl: null,
  isPremium: false,
  transactions: [],
  activeAccountId: null,
  setBalance: () => {},
  setUsername: () => {},
  setAvatarUrl: () => {},
  setIsPremium: () => {},
  deduct: () => false,
  addTransaction: () => {},
  loadAccount: () => false,
});

const INCOMING_SOURCES = [
  "Gruppenausschüttung","Premium-Stipendium","Entwickler-Umtausch",
  "Spielkauf-Einnahmen","Roblox-Belohnung","Marketplace-Verkauf",
  "Spielpass-Einnahmen","Avatar-Shop-Verkauf",
];
const INCOMING_PARTIES = [
  "BloxGroup Pro","RobloxCorp","DevFund Group","Premium Rewards",
  "Elite Builders","NexusGroup","StarCreators","ProDevs Hub",
  "Roblox Inc.","GalaxyStudio","AlphaForce","BuildMasters","PixelGroup",
];
const INCOMING_AMOUNTS = [
  50,75,80,100,120,150,200,250,300,400,500,600,800,1000,1200,1500,2000,2500,3000,5000,
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateIncoming(): Transaction[] {
  const count = randomInt(5, 30);
  const now = Date.now();
  const txs: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = randomInt(0, 364);
    const hoursAgo = randomInt(0, 23);
    const date = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000);
    txs.push({
      id: `inc-${i}-${Math.random().toString(36).slice(2)}`,
      type: "incoming",
      amount: randomPick(INCOMING_AMOUNTS),
      date,
      party: randomPick(INCOMING_PARTIES),
      description: randomPick(INCOMING_SOURCES),
    });
  }
  return txs.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function toStoredTx(tx: Transaction): StoredTransaction {
  return { ...tx, date: tx.date.toISOString() };
}
function fromStoredTx(tx: StoredTransaction): Transaction {
  return { ...tx, date: new Date(tx.date) };
}

const SESSION_ACCOUNT_KEY = "rxgft_session_account";

let idCounter = 0;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalanceState] = useState(90000);
  const [username, setUsernameState] = useState("NoUser");
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);
  const [isPremium, setIsPremiumState] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => generateIncoming());
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  const activeAccountIdRef = useRef<string | null>(null);
  activeAccountIdRef.current = activeAccountId;

  useEffect(() => {
    const savedId = sessionStorage.getItem(SESSION_ACCOUNT_KEY);
    if (savedId) {
      const all = AccountsStore.getAll();
      const acc = all.find((a) => a.id === savedId);
      if (acc) {
        setBalanceState(acc.balance);
        setUsernameState(acc.username);
        setAvatarUrlState(acc.avatarUrl);
        setIsPremiumState(acc.isPremium);
        setTransactions(acc.transactions.map(fromStoredTx));
        setActiveAccountId(acc.id);
      }
    }
  }, []);

  /* Auto-fetch avatar when username is known but avatarUrl is missing */
  useEffect(() => {
    if (!username || username === "NoUser" || avatarUrl) return;
    let cancelled = false;
    fetchRobloxAvatar(username).then((result) => {
      if (cancelled || !result?.avatarUrl) return;
      setAvatarUrlState(result.avatarUrl);
      const id = activeAccountIdRef.current;
      if (id) {
        const all = AccountsStore.getAll();
        const acc = all.find((a) => a.id === id);
        if (acc) { acc.avatarUrl = result.avatarUrl; AccountsStore.save(acc); }
      }
    });
    return () => { cancelled = true; };
  }, [username, avatarUrl]);

  function persistTxs(id: string, txs: Transaction[]) {
    AccountsStore.updateTransactions(id, txs.map(toStoredTx));
  }

  function setBalance(newBalance: number) {
    setBalanceState(newBalance);
    const id = activeAccountIdRef.current;
    if (id) AccountsStore.updateBalance(id, newBalance);
  }

  function setUsername(newUsername: string) {
    setUsernameState(newUsername);
  }

  function setAvatarUrl(url: string | null) {
    setAvatarUrlState(url);
    const id = activeAccountIdRef.current;
    if (id) {
      const all = AccountsStore.getAll();
      const acc = all.find((a) => a.id === id);
      if (acc) {
        acc.avatarUrl = url;
        AccountsStore.save(acc);
      }
    }
  }

  function setIsPremium(v: boolean) {
    setIsPremiumState(v);
    const id = activeAccountIdRef.current;
    if (id) {
      const all = AccountsStore.getAll();
      const acc = all.find((a) => a.id === id);
      if (acc) {
        acc.isPremium = v;
        AccountsStore.save(acc);
      }
    }
  }

  function loadAccount(uname: string): boolean {
    const acc = AccountsStore.getByUsername(uname);
    if (!acc) return false;
    setBalanceState(acc.balance);
    setUsernameState(acc.username);
    setAvatarUrlState(acc.avatarUrl);
    setIsPremiumState(acc.isPremium);
    const txs = acc.transactions.map(fromStoredTx);
    setTransactions(txs);
    setActiveAccountId(acc.id);
    activeAccountIdRef.current = acc.id;
    sessionStorage.setItem(SESSION_ACCOUNT_KEY, acc.id);
    return true;
  }

  function deduct(amount: number): boolean {
    if (amount > balance) return false;
    const newBal = balance - amount;
    setBalanceState(newBal);
    const id = activeAccountIdRef.current;
    if (id) AccountsStore.updateBalance(id, newBal);
    return true;
  }

  function addTransaction(tx: Omit<Transaction, "id">) {
    const newTx: Transaction = { ...tx, id: `tx-${++idCounter}-${Date.now()}` };
    setTransactions((prev) => {
      const next = [newTx, ...prev];
      const id = activeAccountIdRef.current;
      if (id) persistTxs(id, next);
      return next;
    });
  }

  return (
    <WalletContext.Provider
      value={{
        balance, username, avatarUrl, isPremium, transactions, activeAccountId,
        setBalance, setUsername, setAvatarUrl, setIsPremium,
        deduct, addTransaction, loadAccount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  return useContext(WalletContext);
}
