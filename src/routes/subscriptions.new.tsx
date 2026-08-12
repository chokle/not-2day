import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { useSubscriptions } from "@/hooks/useSubscriptions";

export const Route = createFileRoute("/subscriptions/new")({
  head: () => ({
    meta: [
      { title: "Add a subscription — TrialKeeper" },
      {
        name: "description",
        content:
          "Add a subscription or free trial manually, or start from a preset that fills in price, billing cycle and the real cancellation link.",
      },
      { property: "og:title", content: "Add a subscription — TrialKeeper" },
      {
        property: "og:description",
        content: "Track a new subscription or trial with its cancellation route pre-filled.",
      },
    ],
  }),
  component: NewSubscription,
});

function NewSubscription() {
  const { add } = useSubscriptions();
  const navigate = useNavigate();

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Back
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Add a subscription</h1>
      <SubscriptionForm
        submitLabel="Save subscription"
        onSubmit={(draft) => {
          add(draft);
          navigate({ to: "/" });
        }}
      />
    </main>
  );
}
