import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscriptionSchema, type Subscription } from "@/lib/subscriptions";
import { fetchRemote, subToRow } from "@/lib/remote-subscriptions";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "trialkeeper.subscriptions.v1";

export function readLocal(): Subscription[] {
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

export function clearLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

export function useSubscriptions() {
  const { user, ready } = useAuth();
  const userId = user?.id ?? null;
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (userId) {
      try {
        setSubs(await fetchRemote());
      } catch {
        setSubs([]);
      }
    } else {
      setSubs(readLocal());
    }
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
    const sync = () => {
      void refresh();
    };
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, [ready, refresh]);

  const persistLocal = useCallback((next: Subscription[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notify();
  }, []);

  const add = useCallback(
    async (sub: Omit<Subscription, "id" | "createdAt">) => {
      if (userId) {
        await supabase.from("subscriptions").insert(subToRow(sub, userId) as never);
        await refresh();
        return;
      }
      persistLocal([
        ...readLocal(),
        { ...sub, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ]);
    },
    [userId, persistLocal, refresh],
  );

  const addMany = useCallback(
    async (items: Omit<Subscription, "id" | "createdAt">[]) => {
      if (!items.length) return;
      if (userId) {
        await supabase
          .from("subscriptions")
          .insert(items.map((i) => subToRow(i, userId)) as never);
        await refresh();
        return;
      }
      const now = new Date().toISOString();
      persistLocal([
        ...readLocal(),
        ...items.map((sub) => ({ ...sub, id: crypto.randomUUID(), createdAt: now })),
      ]);
    },
    [userId, persistLocal, refresh],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Subscription>) => {
      if (userId) {
        await supabase
          .from("subscriptions")
          .update(subToRow(patch) as never)
          .eq("id", id);
        await refresh();
        return;
      }
      persistLocal(readLocal().map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [userId, persistLocal, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      if (userId) {
        await supabase.from("subscriptions").delete().eq("id", id);
        await refresh();
        return;
      }
      persistLocal(readLocal().filter((s) => s.id !== id));
    },
    [userId, persistLocal, refresh],
  );

  const replaceAll = useCallback(
    async (items: Subscription[]) => {
      if (userId) {
        await supabase.from("subscriptions").delete().eq("user_id", userId);
        if (items.length) {
          await supabase
            .from("subscriptions")
            .insert(items.map((i) => subToRow(i, userId)) as never);
        }
        await refresh();
        return;
      }
      persistLocal(items);
    },
    [userId, persistLocal, refresh],
  );

  return { subs, loaded, add, addMany, update, remove, replaceAll, refresh, signedIn: !!userId };
}
