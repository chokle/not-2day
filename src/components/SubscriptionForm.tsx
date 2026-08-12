import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceLogo } from "@/components/ServiceLogo";
import { SERVICE_PRESETS, type ServicePreset } from "@/data/services";
import type { Cycle, Subscription } from "@/lib/subscriptions";

export type SubscriptionDraft = Omit<Subscription, "id" | "createdAt">;

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function SubscriptionForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  initial?: Partial<SubscriptionDraft>;
  submitLabel: string;
  onSubmit: (draft: SubscriptionDraft) => void;
  onDelete?: (() => void) | undefined;
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<SubscriptionDraft>({
    name: initial?.name ?? "",
    price: initial?.price ?? 0,
    currency: initial?.currency ?? "USD",
    cycle: initial?.cycle ?? "monthly",
    status: initial?.status ?? "active",
    ...(initial?.domain ? { domain: initial.domain } : {}),
    ...(initial?.category ? { category: initial.category } : {}),
    ...(initial?.startDate ? { startDate: initial.startDate } : {}),
    ...(initial?.nextChargeDate ? { nextChargeDate: initial.nextChargeDate } : {}),
    ...(initial?.trialEndDate ? { trialEndDate: initial.trialEndDate } : {}),
    ...(initial?.cancelUrl ? { cancelUrl: initial.cancelUrl } : {}),
    ...(initial?.cancelSteps ? { cancelSteps: initial.cancelSteps } : {}),
    ...(initial?.supportEmail ? { supportEmail: initial.supportEmail } : {}),
    ...(initial?.notes ? { notes: initial.notes } : {}),
  });

  const set = <K extends keyof SubscriptionDraft>(key: K, value: SubscriptionDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const applyPreset = (preset: ServicePreset) => {
    setDraft((d) => ({
      ...d,
      name: preset.name,
      domain: preset.domain,
      category: preset.category,
      price: preset.typicalPrice,
      cycle: preset.cycle,
      cancelUrl: preset.cancelUrl,
      cancelSteps: preset.cancelSteps,
      ...(preset.supportEmail ? { supportEmail: preset.supportEmail } : {}),
      ...(preset.trialDays ? { trialEndDate: addDaysISO(preset.trialDays) } : {}),
    }));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.name.trim()) return;
        onSubmit(draft);
      }}
    >
      <section>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Quick pick a known service
        </p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {SERVICE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary"
            >
              <ServiceLogo name={preset.name} domain={preset.domain} className="size-9" />
              <span className="line-clamp-2 text-[11px] leading-tight">{preset.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="name">Service name</Label>
        <Input
          id="name"
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Netflix"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={String(draft.price)}
            onChange={(e) => set("price", Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={draft.currency}
            onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Billing cycle</Label>
        <Select value={draft.cycle} onValueChange={(v) => set("cycle", v as Cycle)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="trial">Free trial ends</Label>
          <Input
            id="trial"
            type="date"
            value={draft.trialEndDate ?? ""}
            onChange={(e) => set("trialEndDate", e.target.value || undefined)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="next">Next charge</Label>
          <Input
            id="next"
            type="date"
            value={draft.nextChargeDate ?? ""}
            onChange={(e) => set("nextChargeDate", e.target.value || undefined)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={draft.category ?? ""}
            onChange={(e) => set("category", e.target.value || undefined)}
            placeholder="Streaming"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Website</Label>
          <Input
            id="domain"
            value={draft.domain ?? ""}
            onChange={(e) => set("domain", e.target.value || undefined)}
            placeholder="netflix.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cancelUrl">Cancellation page URL</Label>
        <Input
          id="cancelUrl"
          value={draft.cancelUrl ?? ""}
          onChange={(e) => set("cancelUrl", e.target.value || undefined)}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supportEmail">Support email (for cancellation letters)</Label>
        <Input
          id="supportEmail"
          type="email"
          value={draft.supportEmail ?? ""}
          onChange={(e) => set("supportEmail", e.target.value || undefined)}
          placeholder="support@service.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={draft.notes ?? ""}
          onChange={(e) => set("notes", e.target.value || undefined)}
          placeholder="Card used, who shares the account, …"
        />
      </div>

      <div className="flex gap-2 pb-4">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/" })}>
          Cancel
        </Button>
      </div>

      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          Delete this subscription
        </Button>
      ) : null}
    </form>
  );
}
