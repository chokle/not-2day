import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Mail, ShieldAlert, Download, Upload } from "lucide-react";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
  countdownLabel,
  daysUntil,
  formatMoney,
  isTrial,
  monthlyCost,
  subscriptionSchema,
  urgency,
  yearlyCost,
  type Subscription,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrialKeeper — Track subscriptions and kill free trials on time" },
      {
        name: "description",
        content:
          "See every subscription and free trial in one place, get warned before a trial charges you, and cancel with one button instead of digging through FAQs.",
      },
      { property: "og:title", content: "TrialKeeper — Never get charged for a forgotten trial" },
      {
        property: "og:description",
        content:
          "Track subscriptions, count down free trials, and cancel with a direct link or ready-made cancellation email.",
      },
    ],
  }),
  component: Dashboard,
});

type Filter = "all" | "trials" | "paid" | "cancelled";

function Dashboard() {
  const { subs, loaded, replaceAll } = useSubscriptions();
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const active = useMemo(() => subs.filter((s) => s.status === "active"), [subs]);
  const trials = useMemo(() => active.filter(isTrial), [active]);
  const monthly = active
    .filter((s) => !isTrial(s))
    .reduce((sum, s) => sum + monthlyCost(s), 0);
  const atRisk = trials.reduce((sum, s) => sum + yearlyCost(s) / 12, 0);

  const expiringSoon = useMemo(
    () =>
      trials
        .map((s) => ({ sub: s, days: daysUntil(s.trialEndDate)! }))
        .filter((t) => t.days <= 7)
        .sort((a, b) => a.days - b.days),
    [trials],
  );

  const visible = useMemo(() => {
    const list =
      filter === "all"
        ? subs
        : filter === "trials"
          ? subs.filter(isTrial)
          : filter === "paid"
            ? subs.filter((s) => s.status === "active" && !isTrial(s))
            : subs.filter((s) => s.status === "cancelled");
    return [...list].sort((a, b) => {
      const da = daysUntil(a.trialEndDate) ?? 9999;
      const db = daysUntil(b.trialEndDate) ?? 9999;
      return da - db;
    });
  }, [subs, filter]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(subs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trialkeeper-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const items: Subscription[] = Array.isArray(parsed)
          ? parsed.flatMap((i: unknown) => {
              const r = subscriptionSchema.safeParse(i);
              return r.success ? [r.data] : [];
            })
          : [];
        if (items.length) replaceAll(items);
      } catch {
        /* ignore malformed files */
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-28 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          TrialKeeper
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Your subscriptions, under control
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trial countdowns, real spend, and a straight path to the cancel button.
        </p>
      </header>

      {expiringSoon.length > 0 && (
        <section className="mb-6 space-y-2">
          {expiringSoon.map(({ sub, days }) => (
            <Link
              key={sub.id}
              to="/subscriptions/$id/cancel"
              params={{ id: sub.id }}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-sm",
                urgency(days) === "critical"
                  ? "border-destructive/60 bg-destructive/10"
                  : "border-accent/60 bg-accent/10",
              )}
            >
              <ShieldAlert
                className={cn(
                  "size-5 shrink-0",
                  urgency(days) === "critical" ? "text-destructive" : "text-accent",
                )}
              />
              <span className="flex-1">
                <strong>{sub.name}</strong> trial ends {countdownLabel(days)} — then{" "}
                {formatMoney(sub.price, sub.currency)} starts.
              </span>
              <span className="text-xs font-semibold underline">Cancel</span>
            </Link>
          ))}
        </section>
      )}

      <section className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Per month" value={formatMoney(monthly)} />
        <StatCard label="Per year" value={formatMoney(monthly * 12)} />
        <StatCard
          label="Trials at risk"
          value={formatMoney(atRisk)}
          tone={atRisk > 0 ? "warn" : "calm"}
        />
      </section>

      <section className="mb-4 flex gap-2">
        <Button className="flex-1" onClick={() => navigate({ to: "/subscriptions/new" })}>
          <Plus /> Add subscription
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/import" })}>
          <Mail /> Scan Gmail
        </Button>
      </section>

      <section className="mb-4 flex gap-2 overflow-x-auto">
        {(["all", "trials", "paid", "cancelled"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            {f}
          </button>
        ))}
      </section>

      <section className="space-y-3">
        {!loaded ? (
          <div className="h-24 animate-pulse rounded-2xl bg-card" />
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-medium">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a subscription manually, or let TrialKeeper read your Gmail receipts and
              find them for you.
            </p>
          </div>
        ) : (
          visible.map((sub) => <SubscriptionCard key={sub.id} sub={sub} />)
        )}
      </section>

      <footer className="mt-10 space-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
        <p>
          Your data stays in this browser only — no account, no server copy. Back it up if
          you clear your browser data.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportJson}>
            <Download /> Export
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
            <Upload className="size-4" /> Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file);
              }}
            />
          </label>
        </div>
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone = "calm",
}: {
  label: string;
  value: string;
  tone?: "calm" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          tone === "warn" && "text-accent",
        )}
      >
        {value}
      </p>
    </div>
  );
}
