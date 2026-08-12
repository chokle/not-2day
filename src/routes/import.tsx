import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Mail, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ServiceLogo } from "@/components/ServiceLogo";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { scanGmailForSubscriptions, type ScanCandidate } from "@/lib/gmail-scan.functions";
import { formatMoney, type Subscription } from "@/lib/subscriptions";
import { findPreset } from "@/data/services";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Find subscriptions in Gmail — TrialKeeper" },
      {
        name: "description",
        content:
          "Scan your Gmail receipts and trial confirmations to discover recurring charges you forgot about, then import only the ones you approve.",
      },
      { property: "og:title", content: "Find subscriptions in Gmail — TrialKeeper" },
      {
        property: "og:description",
        content: "Let TrialKeeper read your billing emails and surface every recurring charge.",
      },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const scan = useServerFn(scanGmailForSubscriptions);
  const { subs, addMany } = useSubscriptions();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<ScanCandidate[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const existing = new Set(subs.map((s) => s.name.trim().toLowerCase()));

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await scan({ data: { maxMessages: 35 } });
      if (!result.ok) {
        setError(result.error);
        setCandidates([]);
      } else {
        const fresh = result.candidates.filter(
          (c) => !existing.has(c.name.trim().toLowerCase()),
        );
        setCandidates(fresh);
        setSelected(Object.fromEntries(fresh.map((c) => [c.name, true])));
        toast.success(`Read ${result.scanned} emails`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const importSelected = () => {
    const picked = (candidates ?? []).filter((c) => selected[c.name]);
    if (picked.length === 0) return;
    const drafts: Omit<Subscription, "id" | "createdAt">[] = picked.map((c) => {
      const preset = findPreset(c.name);
      return {
        name: c.name,
        price: c.price,
        currency: c.currency || "USD",
        cycle: c.cycle,
        status: "active" as const,
        ...(c.domain || preset?.domain ? { domain: c.domain ?? preset!.domain } : {}),
        ...(c.category || preset?.category ? { category: c.category ?? preset!.category } : {}),
        ...(c.trialEndDate ? { trialEndDate: c.trialEndDate } : {}),
        ...(c.nextChargeDate ? { nextChargeDate: c.nextChargeDate } : {}),
        ...(preset?.cancelUrl ? { cancelUrl: preset.cancelUrl } : {}),
        ...(preset?.cancelSteps ? { cancelSteps: preset.cancelSteps } : {}),
        ...(preset?.supportEmail ? { supportEmail: preset.supportEmail } : {}),
        notes: `Found in Gmail: ${c.evidence}`,
      };
    });
    addMany(drafts);
    toast.success(`Imported ${drafts.length} subscription${drafts.length > 1 ? "s" : ""}`);
    setCandidates([]);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Find subscriptions in Gmail</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        TrialKeeper reads recent receipts, trial confirmations and renewal notices, then
        shows you what it found. Nothing is saved until you approve it.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Only email subjects, senders and short previews are analysed, and only during a
          scan. Imported subscriptions live in this browser.
        </p>
      </div>

      <Button className="mt-5 h-12 w-full text-base" onClick={run} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Mail />}
        {loading ? "Reading your inbox…" : "Scan my Gmail"}
      </Button>

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-sm">
          {error}
        </p>
      )}

      {candidates && candidates.length === 0 && !error && !loading && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing new found. Everything the scan spotted is already on your dashboard.
        </p>
      )}

      {candidates && candidates.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Found {candidates.length}
          </h2>
          <ul className="mt-3 space-y-2">
            {candidates.map((c) => (
              <li
                key={c.name}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <Checkbox
                  checked={!!selected[c.name]}
                  onCheckedChange={(v) =>
                    setSelected((s) => ({ ...s, [c.name]: v === true }))
                  }
                  className="mt-1"
                />
                <ServiceLogo
                  name={c.name}
                  domain={c.domain ?? findPreset(c.name)?.domain}
                  className="size-9"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {formatMoney(c.price, c.currency || "USD")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.cycle}
                    {c.trialEndDate ? ` · trial ends ${c.trialEndDate}` : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                    “{c.evidence}”
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full" onClick={importSelected}>
            Import selected
          </Button>
        </>
      )}
    </main>
  );
}
