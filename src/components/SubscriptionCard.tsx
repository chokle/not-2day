import { Link } from "@tanstack/react-router";
import { ServiceLogo } from "@/components/ServiceLogo";
import { Badge } from "@/components/ui/badge";
import {
  CYCLE_LABEL,
  countdownLabel,
  daysUntil,
  formatDate,
  formatMoney,
  isTrial,
  urgency,
  type Subscription,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

export function SubscriptionCard({ sub }: { sub: Subscription }) {
  const trial = isTrial(sub);
  const days = daysUntil(sub.trialEndDate);
  const level = trial && days !== undefined ? urgency(days) : "calm";
  const cancelled = sub.status === "cancelled";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 transition-colors",
        cancelled && "opacity-55",
        level === "critical" && "border-destructive/60",
        level === "soon" && "border-accent/60",
      )}
    >
      <div className="flex items-start gap-3">
        <ServiceLogo name={sub.name} domain={sub.domain} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{sub.name}</p>
              <p className="text-xs text-muted-foreground">
                {sub.category ?? "Subscription"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">
                {formatMoney(sub.price, sub.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                per {CYCLE_LABEL[sub.cycle]}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {cancelled ? (
              <Badge variant="secondary">Cancelled</Badge>
            ) : trial && days !== undefined ? (
              <Badge
                className={cn(
                  "border-0",
                  level === "critical"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-accent text-accent-foreground",
                )}
              >
                Trial ends {countdownLabel(days)}
              </Badge>
            ) : (
              <Badge variant="secondary">
                Next charge {formatDate(sub.nextChargeDate)}
              </Badge>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Link
              to="/subscriptions/$id/cancel"
              params={{ id: sub.id }}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {cancelled ? "Cancel info" : "Cancel this"}
            </Link>
            <Link
              to="/subscriptions/$id/edit"
              params={{ id: sub.id }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
