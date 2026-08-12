import { z } from "zod";

export const cycleSchema = z.enum(["weekly", "monthly", "quarterly", "yearly"]);
export type Cycle = z.infer<typeof cycleSchema>;

export const subscriptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  domain: z.string().optional(),
  category: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().default("USD"),
  cycle: cycleSchema,
  startDate: z.string().optional(),
  nextChargeDate: z.string().optional(),
  trialEndDate: z.string().optional(),
  cancelUrl: z.string().optional(),
  cancelSteps: z.array(z.string()).optional(),
  supportEmail: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "cancelled"]).default("active"),
  createdAt: z.string(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export const CYCLE_LABEL: Record<Cycle, string> = {
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

const CYCLES_PER_YEAR: Record<Cycle, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export function yearlyCost(sub: Subscription) {
  return sub.price * CYCLES_PER_YEAR[sub.cycle];
}

export function monthlyCost(sub: Subscription) {
  return yearlyCost(sub) / 12;
}

export function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function daysUntil(dateStr?: string) {
  if (!dateStr) return undefined;
  const target = startOfDay(new Date(`${dateStr}T00:00:00`));
  if (Number.isNaN(target.getTime())) return undefined;
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function isTrial(sub: Subscription) {
  const d = daysUntil(sub.trialEndDate);
  return sub.status === "active" && d !== undefined && d >= 0;
}

export function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function countdownLabel(days: number) {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export function urgency(days: number): "critical" | "soon" | "calm" {
  if (days <= 2) return "critical";
  if (days <= 7) return "soon";
  return "calm";
}

export function cancellationEmail(sub: Subscription) {
  const subject = `Cancellation request — ${sub.name}`;
  const body = [
    `Hello ${sub.name} support team,`,
    "",
    `I am writing to cancel my ${sub.name} subscription, effective immediately.`,
    sub.trialEndDate
      ? `My free trial ends on ${formatDate(sub.trialEndDate)} and I do not wish to be charged.`
      : `Please stop all future charges of ${formatMoney(sub.price, sub.currency)} per ${CYCLE_LABEL[sub.cycle]}.`,
    "",
    "Please confirm in writing that:",
    "1. The subscription has been cancelled.",
    "2. No further payments will be taken from my payment method.",
    "3. My stored payment details have been removed.",
    "",
    "I am not requesting a pause, downgrade, or retention offer — only cancellation.",
    "",
    "Thank you,",
    "[Your name]",
    "[Account email associated with the subscription]",
  ].join("\n");
  return { subject, body };
}
