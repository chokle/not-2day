import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { readLocal, clearLocal } from "@/hooks/useSubscriptions";
import { subToRow } from "@/lib/remote-subscriptions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TrialKeeper" },
      {
        name: "description",
        content:
          "Sign in to TrialKeeper so your subscriptions sync and you get emailed before a free trial or renewal charges you.",
      },
      { property: "og:title", content: "Sign in — TrialKeeper" },
      {
        property: "og:description",
        content: "Sign in to sync your subscriptions and turn on trial reminder emails.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signedIn, user, ready } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirm, setSentConfirm] = useState(false);

  // Move anything saved in this browser into the account once signed in.
  useEffect(() => {
    if (!signedIn || !user) return;
    const local = readLocal();
    if (local.length) {
      void supabase
        .from("subscriptions")
        .insert(local.map((s) => subToRow(s, user.id)) as never)
        .then(() => {
          clearLocal();
          toast.success(`Moved ${local.length} saved subscriptions into your account`);
        });
    }
    void navigate({ to: "/" });
  }, [signedIn, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      setSentConfirm(true);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed. Try again.");
  };

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-16 pt-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        An account lets TrialKeeper email you before a trial or renewal charges you — even
        when the app is closed.
      </p>

      {sentConfirm ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
          Check <strong>{email}</strong> and click the confirmation link to finish setting up
          your account.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
      )}

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={google}>
        Continue with Google
      </Button>

      <button
        className="mt-6 w-full text-sm text-muted-foreground underline"
        onClick={() => {
          setSentConfirm(false);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
      >
        {mode === "signin"
          ? "No account yet? Create one"
          : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
