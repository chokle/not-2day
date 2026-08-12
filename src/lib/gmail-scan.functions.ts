import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail";

const candidateSchema = z.object({
  name: z.string(),
  price: z.number(),
  currency: z.string(),
  cycle: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  trialEndDate: z.string().nullable(),
  nextChargeDate: z.string().nullable(),
  category: z.string().nullable(),
  domain: z.string().nullable(),
  evidence: z.string(),
});

const resultSchema = z.object({ subscriptions: z.array(candidateSchema) });

export type ScanCandidate = z.infer<typeof candidateSchema>;

const GMAIL_QUERY =
  'newer_than:180d (subject:(receipt OR invoice OR subscription OR "free trial" OR renewal OR "payment" OR "your plan") OR from:(billing OR receipts OR no-reply OR noreply OR invoice))';

async function gmail(path: string, keys: { lovable: string; connection: string }) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${keys.lovable}`,
      "X-Connection-Api-Key": keys.connection,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail request failed [${res.status}]: ${text}`);
  }
  return res.json();
}

function headerValue(headers: Array<{ name: string; value: string }>, name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export const scanGmailForSubscriptions = createServerFn({ method: "POST" })
  .inputValidator((input: { maxMessages?: number }) =>
    z.object({ maxMessages: z.number().min(5).max(60).default(35) }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["GOOGLE_MAIL_API_KEY"];

    if (!connectionKey) {
      return {
        ok: false as const,
        error: "Gmail is not connected yet.",
        candidates: [] as ScanCandidate[],
      };
    }
    if (!lovableKey) {
      return {
        ok: false as const,
        error: "AI is not configured for this project.",
        candidates: [] as ScanCandidate[],
      };
    }

    const keys = { lovable: lovableKey, connection: connectionKey };

    let list: { messages?: Array<{ id: string }> };
    try {
      list = (await gmail(
        `/gmail/v1/users/me/messages?maxResults=${data.maxMessages}&q=${encodeURIComponent(GMAIL_QUERY)}`,
        keys,
      )) as { messages?: Array<{ id: string }> };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Gmail scan failed",
        candidates: [] as ScanCandidate[],
      };
    }

    const ids = (list.messages ?? []).map((m) => m.id);
    if (ids.length === 0) {
      return { ok: true as const, scanned: 0, candidates: [] as ScanCandidate[] };
    }

    const digests: string[] = [];
    for (const id of ids) {
      try {
        const msg = (await gmail(
          `/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          keys,
        )) as {
          snippet?: string;
          payload?: { headers?: Array<{ name: string; value: string }> };
        };
        const headers = msg.payload?.headers ?? [];
        digests.push(
          [
            `From: ${headerValue(headers, "From")}`,
            `Date: ${headerValue(headers, "Date")}`,
            `Subject: ${headerValue(headers, "Subject")}`,
            `Snippet: ${(msg.snippet ?? "").slice(0, 320)}`,
          ].join("\n"),
        );
      } catch {
        /* skip unreadable message */
      }
    }

    if (digests.length === 0) {
      return { ok: true as const, scanned: 0, candidates: [] as ScanCandidate[] };
    }

    const gateway = createLovableAiGatewayProvider(lovableKey);
    const model = gateway("google/gemini-3-flash-preview");
    const today = new Date().toISOString().slice(0, 10);

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: resultSchema }),
        prompt: [
          `Today is ${today}.`,
          "Below are email digests from a personal inbox. Identify recurring paid subscriptions and free trials.",
          "Rules: one entry per distinct service (merge duplicates, keep the most recent amount).",
          "Ignore one-off purchases, shipping notices, marketing, and anything without a recurring charge or trial.",
          "Use ISO dates (YYYY-MM-DD) or null when unknown. Use ISO currency codes. Return at most 20 entries.",
          "evidence: a short quote from the email that justifies the entry.",
          "",
          digests.join("\n---\n"),
        ].join("\n"),
      });
      return { ok: true as const, scanned: digests.length, candidates: output.subscriptions };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return {
          ok: true as const,
          scanned: digests.length,
          candidates: [] as ScanCandidate[],
        };
      }
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Could not read the emails",
        candidates: [] as ScanCandidate[],
      };
    }
  });
