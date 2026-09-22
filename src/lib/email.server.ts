/**
 * Sending transactional email requires a verified sending domain for the
 * project. Until one is configured, reminders are computed and logged but not
 * dispatched, so the scheduler stays safe to run.
 */
export type SendResult = { sent: boolean; reason?: string };

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  try {
    // The transactional template system is scaffolded once a sending domain is
    // verified; it exports `sendTransactionalEmail`.
    const mod = (await import("@/lib/emails/send").catch(() => null)) as {
      sendTransactionalEmail?: (args: unknown) => Promise<unknown>;
    } | null;
    if (!mod?.sendTransactionalEmail) {
      console.warn("[reminders] no sending domain configured; skipped", input.to);
      return { sent: false, reason: "no_email_domain" };
    }
    await mod.sendTransactionalEmail(input);
    return { sent: true };
  } catch (error) {
    console.error("[reminders] email send failed", error);
    return { sent: false, reason: String(error) };
  }
}
