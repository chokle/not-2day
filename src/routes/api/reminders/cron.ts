/**
 * POST /api/reminders/cron
 *
 * Daily trigger for the TrialKeeper reminder sweep. Called by the
 * `reminder-sweep` GitHub Actions workflow (or any scheduler) with:
 *   Authorization: Bearer <LOVABLE_CRON_SECRET>
 *
 * The endpoint never serves browsers and never sends anything without a
 * valid cron secret. See src/lib/reminders.server.ts for the engine.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/reminders/cron")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;

        try {
          const { runReminderSweep } = await import("@/lib/reminders.server");
          const appUrl = process.env["APP_URL"] ?? new URL(request.url).origin;
          const summary = await runReminderSweep({ appUrl });
          // 503 when the engine couldn't run (e.g. no RESEND_API_KEY) so the
          // scheduler's failure alerting fires instead of silently passing.
          return Response.json(summary, { status: summary.ok ? 200 : 503 });
        } catch (error) {
          console.error("[reminders] sweep crashed", error);
          return Response.json({ ok: false, error: "reminder sweep failed" }, { status: 500 });
        }
      },
      GET: () =>
        new Response("Method not allowed — POST with a cron bearer token", {
          status: 405,
        }),
    },
  },
});
