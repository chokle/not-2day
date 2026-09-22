import { supabase } from "@/integrations/supabase/client";
import { cycleSchema, type Subscription } from "@/lib/subscriptions";

type Row = {
  id: string;
  name: string;
  domain: string | null;
  category: string | null;
  price: number | string;
  currency: string;
  cycle: string;
  start_date: string | null;
  next_charge_date: string | null;
  trial_end_date: string | null;
  cancel_url: string | null;
  cancel_steps: string[] | null;
  support_email: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export function rowToSub(row: Row): Subscription {
  const cycle = cycleSchema.safeParse(row.cycle);
  return {
    id: row.id,
    name: row.name,
    domain: row.domain ?? undefined,
    category: row.category ?? undefined,
    price: Number(row.price),
    currency: row.currency ?? "USD",
    cycle: cycle.success ? cycle.data : "monthly",
    startDate: row.start_date ?? undefined,
    nextChargeDate: row.next_charge_date ?? undefined,
    trialEndDate: row.trial_end_date ?? undefined,
    cancelUrl: row.cancel_url ?? undefined,
    cancelSteps: row.cancel_steps ?? undefined,
    supportEmail: row.support_email ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status === "cancelled" ? "cancelled" : "active",
    createdAt: row.created_at,
  };
}

export function subToRow(sub: Partial<Subscription>, userId?: string) {
  const row: Record<string, unknown> = {};
  if (userId) row["user_id"] = userId;
  if (sub.name !== undefined) row["name"] = sub.name;
  if (sub.domain !== undefined) row["domain"] = sub.domain ?? null;
  if (sub.category !== undefined) row["category"] = sub.category ?? null;
  if (sub.price !== undefined) row["price"] = sub.price;
  if (sub.currency !== undefined) row["currency"] = sub.currency;
  if (sub.cycle !== undefined) row["cycle"] = sub.cycle;
  if (sub.startDate !== undefined) row["start_date"] = sub.startDate || null;
  if (sub.nextChargeDate !== undefined) row["next_charge_date"] = sub.nextChargeDate || null;
  if (sub.trialEndDate !== undefined) row["trial_end_date"] = sub.trialEndDate || null;
  if (sub.cancelUrl !== undefined) row["cancel_url"] = sub.cancelUrl ?? null;
  if (sub.cancelSteps !== undefined) row["cancel_steps"] = sub.cancelSteps ?? null;
  if (sub.supportEmail !== undefined) row["support_email"] = sub.supportEmail ?? null;
  if (sub.notes !== undefined) row["notes"] = sub.notes ?? null;
  if (sub.status !== undefined) row["status"] = sub.status;
  return row;
}

export async function fetchRemote(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as Row[]).map(rowToSub);
}
