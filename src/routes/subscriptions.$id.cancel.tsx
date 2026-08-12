import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Copy, ExternalLink, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { ServiceLogo } from "@/components/ServiceLogo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { findPreset } from "@/data/services";
import {
  CYCLE_LABEL,
  cancellationEmail,
  countdownLabel,
  daysUntil,
  formatMoney,
  isTrial,
} from "@/lib/subscriptions";

export const Route = createFileRoute("/subscriptions/$id/cancel")({
  head: () => ({
    meta: [
      { title: "Cancel this subscription — TrialKeeper" },
      {
        name: "description",
        content:
          "One button to the real cancellation page, the exact click path, and a ready-to-send cancellation email — no FAQ maze, no phone call.",
      },
      { property: "og:title", content: "Cancel this subscription — TrialKeeper" },
      {
        property: "og:description",
        content: "Skip the retention maze: direct cancel link plus a pre-written cancellation email.",
      },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  const { id } = Route.useParams();
  const { subs, loaded, update } = useSubscriptions();
  const navigate = useNavigate();
  const sub = subs.find((s) => s.id === id);
  const [copied, setCopied] = useState(false);

  if (!loaded) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pt-8">
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      </main>
    );
  }

  if (!sub) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pt-8">
        <p className="text-sm text-muted-foreground">This subscription no longer exists.</p>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const preset = findPreset(sub.name);
  const cancelUrl = sub.cancelUrl ?? preset?.cancelUrl;
  const steps = sub.cancelSteps ?? preset?.cancelSteps ?? [];
  const supportEmail = sub.supportEmail ?? preset?.supportEmail;
  const { subject, body } = cancellationEmail(sub);
  const trialDays = daysUntil(sub.trialEndDate);

  const mailto = `mailto:${supportEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    toast.success("Cancellation email copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Back
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <ServiceLogo name={sub.name} domain={sub.domain} className="size-14" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cancel {sub.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatMoney(sub.price, sub.currency)} per {CYCLE_LABEL[sub.cycle]}
            {isTrial(sub) && trialDays !== undefined
              ? ` · trial ends ${countdownLabel(trialDays)}`
              : ""}
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Option 1 · Direct link
        </p>
        {cancelUrl ? (
          <>
            <a href={cancelUrl} target="_blank" rel="noreferrer" className="mt-3 block">
              <Button className="h-12 w-full text-base">
                Cancel {sub.name} now <ExternalLink />
              </Button>
            </a>
            <p className="mt-2 break-all text-xs text-muted-foreground">{cancelUrl}</p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No cancellation link saved for this service yet. Add one on the edit screen, or
            use the email below.
          </p>
        )}

        {steps.length > 0 && (
          <ol className="mt-4 space-y-2 text-sm">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Option 2 · Cancellation email
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A firm, ready-to-send request that refuses retention offers.
          {supportEmail ? ` Addressed to ${supportEmail}.` : " Add a support email to send it directly."}
        </p>
        <Textarea readOnly value={body} className="mt-3 h-56 text-xs" />
        <div className="mt-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={copy}>
            {copied ? <Check /> : <Copy />} Copy
          </Button>
          <a href={mailto} className="flex-1">
            <Button className="w-full">
              <Mail /> Open in mail app
            </Button>
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Done with it?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Mark it cancelled so it stops counting toward your spend.
        </p>
        <div className="mt-3 flex gap-2">
          {sub.status === "active" ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                update(sub.id, { status: "cancelled" });
                toast.success(`${sub.name} marked as cancelled`);
                navigate({ to: "/" });
              }}
            >
              Mark as cancelled
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                update(sub.id, { status: "active" });
                toast.success(`${sub.name} is active again`);
              }}
            >
              Reactivate
            </Button>
          )}
        </div>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        No service lets an outside app press their cancel button for you. TrialKeeper takes
        you straight to it and hands you the wording, so it takes seconds instead of an
        afternoon.
      </p>
    </main>
  );
}
