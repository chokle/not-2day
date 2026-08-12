import { useCallback, useEffect, useState } from "react";
import { subscriptionSchema, type Subscription } from "@/lib/subscriptions";

const STORAGE_KEY = "trialkeeper.subscriptions.v1";

function read(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = subscriptionSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

export function useSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setSubs(read());
    sync();
    setLoaded(true);
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = useCallback((next: Subscription[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notify();
  }, []);

  const add = useCallback(
    (sub: Omit<Subscription, "id" | "createdAt">) => {
      const record: Subscription = {
        ...sub,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      persist([...read(), record]);
      return record;
    },
    [persist],
  );

  const addMany = useCallback(
    (items: Omit<Subscription, "id" | "createdAt">[]) => {
      const now = new Date().toISOString();
      const records = items.map((sub) => ({
        ...sub,
        id: crypto.randomUUID(),
        createdAt: now,
      }));
      persist([...read(), ...records]);
      return records;
    },
    [persist],
  );

  const update = useCallback(
    (id: string, patch: Partial<Subscription>) => {
      persist(read().map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(read().filter((s) => s.id !== id));
    },
    [persist],
  );

  const replaceAll = useCallback(
    (items: Subscription[]) => {
      persist(items);
    },
    [persist],
  );

  return { subs, loaded, add, addMany, update, remove, replaceAll };
}
