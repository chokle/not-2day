export type ReminderKind = "trial" | "renewal";

export function reminderCopy(input: {
  name: string;
  kind: ReminderKind;
  leadDays: number;
  date: string;
  amount: string;
  cycle: string;
  cancelUrl?: string | null;
  appUrl: string;
}) {
  const when =
    input.leadDays === 0
      ? "today"
      : input.leadDays === 1
        ? "tomorrow"
        : `in ${input.leadDays} days`;

  const subject =
    input.kind === "trial"
      ? `${input.name} free trial ends ${when}`
      : `${input.name} renews ${when} — ${input.amount}`;

  const lead =
    input.kind === "trial"
      ? `Your ${input.name} free trial ends ${when} (${input.date}). If you do nothing, you'll be charged ${input.amount} per ${input.cycle}.`
      : `Your ${input.name} subscription renews ${when} (${input.date}) for ${input.amount}.`;

  const text = [
    lead,
    "",
    input.cancelUrl ? `Cancel here: ${input.cancelUrl}` : "",
    `Open TrialKeeper: ${input.appUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#141416;color:#e8e8ea;padding:24px">
      <div style="max-width:520px;margin:0 auto;background:#1c1c20;border-radius:16px;padding:24px">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#f5b74f">TrialKeeper</p>
        <h1 style="margin:0 0 12px;font-size:20px;color:#fff">${subject}</h1>
        <p style="margin:0 0 20px;line-height:1.55;color:#c3c3c9">${lead}</p>
        ${
          input.cancelUrl
            ? `<p style="margin:0 0 12px"><a href="${input.cancelUrl}" style="display:inline-block;background:#f5b74f;color:#141416;font-weight:600;text-decoration:none;padding:12px 18px;border-radius:10px">Cancel ${input.name}</a></p>`
            : ""
        }
        <p style="margin:16px 0 0;font-size:13px"><a href="${input.appUrl}" style="color:#7fe3c0">Open TrialKeeper</a></p>
      </div>
    </div>`;

  return { subject, text, html };
}
