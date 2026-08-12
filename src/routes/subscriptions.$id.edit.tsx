import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { useSubscriptions } from "@/hooks/useSubscriptions";

export const Route = createFileRoute("/subscriptions/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit subscription — TrialKeeper" },
      {
        name: "description",
        content:
          "Update the price, billing cycle, trial end date and cancellation details of a tracked subscription.",
      },
      { property: "og:title", content: "Edit subscription — TrialKeeper" },
      {
        property: "og:description",
        content: "Keep your subscription details and trial countdown accurate.",
      },
    ],
  }),
  component: EditSubscription,
});

function EditSubscription() {
  const { id } = Route.useParams();
  const { subs, loaded, update, remove } = useSubscriptions();
  const navigate = useNavigate();
  const sub = subs.find((s) => s.id === id);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Back
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit subscription</h1>
      {!loaded ? (
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      ) : !sub ? (
        <p className="text-sm text-muted-foreground">This subscription no longer exists.</p>
      ) : (
        <SubscriptionForm
          initial={sub}
          submitLabel="Save changes"
          onSubmit={(draft) => {
            update(sub.id, draft);
            navigate({ to: "/" });
          }}
          onDelete={() => {
            remove(sub.id);
            navigate({ to: "/" });
          }}
        />
      )}
    </main>
  );
}
