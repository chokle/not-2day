/**
 * TrialKeeper reminder engine — server only.
 *
 * `runReminderSweep()` is invoked once a day by the cron endpoint
 * (`src/routes/api/reminders/cron.ts`). It:
 *   1. loads every profile with email reminders enabled,
 *   2. loads their active subscriptions,
 *   3. matches each subscription's trial-end / next-charge date against the
 *      user's `lead_days` preferences (defaults: 7, 3, 1, 0),
 *   4. claims each due reminder in `reminder_sends` first (at-most-once
 *      delivery — the unique constraint on
 *      (subscription_id, kind, target_date, lead_days, channel) makes
 *      duplicates impossible), and only then sends the email via Resend.
 *
 * Known limitation: day boundaries are computed in UTC. A user in UTC-8
 * whose trial ends "today" UTC may receive the reminder a few hours early
 * or late relative to their local midnight. Documented, not fixed.
 */

import { Resend } from "resend";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { reminderCopy, type ReminderKind } from "./reminder-content";
import { formatMoney } from "./subscriptions";

const CHANNEL = "email";

export type SweepSummary = {
  ok: boolean;
  date: string; // UTC day the sweep ran for
  usersChecked: number;
  subscriptionsChecked: number;
  due: number;
  sent: number;
  skippedDuplicate: number;
  failed: number;
  errors: string[];
};

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`, both YYYY-MM-DD, computed on UTC midnights. */
function diffDaysUtc(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

function sanitizeLeadDays(raw: unknown): number[] {
  const days = Array.isArray(raw) ? raw : [7, 3, 1, 0];
  const clean = [
    ...new Set(
      days.filter(
        (d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 365,
      ),
    ),
  ];
  return clean.sort((a, b) => b - a);
}

type Candidate = {
  userId: string;
  email: string;
  subscriptionId: string;
  name: string;
  kind: ReminderKind;
  targetDate: string;
  leadDays: number;
  amount: string;
  cycle: string;
  cancelUrl: string | null;
};

export async function runReminderSweep(opts: { appUrl: string }): Promise<SweepSummary> {
  const today = utcToday();
  const summary: SweepSummary = {
    ok: true,
    date: today,
    usersChecked: 0,
    subscriptionsChecked: 0,
    due: 0,
    sent: 0,
    skippedDuplicate: 0,
    failed: 0,
    errors: [],
  };

  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    // Fail closed: log loudly, send nothing, never crash the cron caller.
    console.error(
      "[reminders] RESEND_API_KEY is not set — skipping all sends. " +
        "Set it in the hosting environment to enable reminder emails.",
    );
    summary.ok = false;
    summary.errors.push("RESEND_API_KEY is not configured");
    return summary;
  }

  const from = process.env["RESEND_FROM"] ?? "TrialKeeper <reminders@trialkeeper.app>";
  const resend = new Resend(resendKey);

  // 1. Users who want email reminders and have an address on file.
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, lead_days")
    .eq("email_reminders", true)
    .not("email", "is", null);

  if (profilesError || !profiles) {
    throw new Error(`[reminders] failed to load profiles: ${profilesError?.message}`);
  }

  const eligible = profiles.filter((p) => p.email);
  summary.usersChecked = eligible.length;
  if (eligible.length === 0) {
    console.log(`[reminders] sweep ${today}: no users with email reminders enabled`);
    return summary;
  }

  // 2. Their active subscriptions.
  const userIds = eligible.map((p) => p.id);
  const { data: subs, error: subsError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, name, price, currency, cycle, trial_end_date, next_charge_date, cancel_url, status",
    )
    .eq("status", "active")
    .in("user_id", userIds);

  if (subsError || !subs) {
    throw new Error(`[reminders] failed to load subscriptions: ${subsError?.message}`);
  }
  summary.subscriptionsChecked = subs.length;

  const profileById = new Map(eligible.map((p) => [p.id, p]));

  // 3. Compute due windows.
  const candidates: Candidate[] = [];
  for (const sub of subs) {
    const profile = profileById.get(sub.user_id);
    if (!profile?.email) continue;

    // A future trial end wins over a renewal date; once the trial has
    // passed, the next charge date drives renewal reminders.
    let targetDate: string | null = null;
    let kind: ReminderKind = "renewal";
    if (sub.trial_end_date && sub.trial_end_date >= today) {
      targetDate = sub.trial_end_date;
      kind = "trial";
    } else if (sub.next_charge_date && sub.next_charge_date >= today) {
      targetDate = sub.next_charge_date;
      kind = "renewal";
    }
    if (!targetDate) continue;

    const daysUntil = diffDaysUtc(today, targetDate);
    for (const lead of sanitizeLeadDays(profile.lead_days)) {
      if (lead === daysUntil) {
        candidates.push({
          userId: sub.user_id,
          email: profile.email,
          subscriptionId: sub.id,
          name: sub.name,
          kind,
          targetDate,
          leadDays: lead,
          amount: formatMoney(Number(sub.price) || 0, sub.currency || "USD"),
          cycle: sub.cycle || "monthly",
          cancelUrl: sub.cancel_url,
        });
      }
    }
  }
  summary.due = candidates.length;
  if (candidates.length === 0) {
    console.log(`[reminders] sweep ${today}: ${subs.length} subscriptions checked, none due`);
    return summary;
  }

  // 4. Claim each due reminder in reminder_sends (at-most-once), then send.
  for (const c of candidates) {
    try {
      const { data: claimed, error: claimError } = await supabaseAdmin
        .from("reminder_sends")
        .upsert(
          {
            user_id: c.userId,
            subscription_id: c.subscriptionId,
            kind: c.kind,
            target_date: c.targetDate,
            lead_days: c.leadDays,
            channel: CHANNEL,
          },
          {
            onConflict: "subscription_id,kind,target_date,lead_days,channel",
            ignoreDuplicates: true,
          },
        )
        .select("id");

      if (claimError) throw claimError;
      if (!claimed || claimed.length === 0) {
        summary.skippedDuplicate += 1;
        continue; // already sent for this window
      }

      const { subject, text, html } = reminderCopy({
        name: c.name,
        kind: c.kind,
        leadDays: c.leadDays,
        date: c.targetDate,
        amount: c.amount,
        cycle: c.cycle,
        cancelUrl: c.cancelUrl,
        appUrl: opts.appUrl,
      });

      const { error: sendError } = await resend.emails.send({
        from,
        to: c.email,
        subject,
        text,
        html,
      });
      if (sendError) throw new Error(sendError.message);

      summary.sent += 1;
      console.log(
        `[reminders] sent ${c.kind}/${c.leadDays}d reminder for "${c.name}" to ${c.email}`,
      );
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(`${c.name} (${c.email}): ${message}`);
      console.error(`[reminders] failed for "${c.name}" (${c.email}):`, message);
    }
  }

  if (summary.failed > 0) summary.ok = false;
  console.log(
    `[reminders] sweep ${today} done: ${summary.sent} sent, ` +
      `${summary.skippedDuplicate} duplicates skipped, ${summary.failed} failed`,
  );
  return summary;
}
