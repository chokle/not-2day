# Subscription & Trial Manager

A personal dashboard that tracks every subscription and free trial you have, warns you before a trial converts to a paid plan, and gives you one button per service to actually get out of it.

## Core screens

**Dashboard (`/`)**
- "Expiring soon" strip at the top: trials ending in the next 7 days, with a day countdown and urgency colors (red under 3 days).
- Monthly and yearly spend totals, plus "at risk" total (what your active trials will start charging if you do nothing).
- Card list of all subscriptions: logo, name, price, billing cycle, next charge date, trial badge.
- Filters: all / trials / active paid / cancelled.

**Add or edit a subscription (`/subscriptions/new`, `/subscriptions/$id`)**
- Manual entry: name, price, currency, billing cycle (monthly / yearly / weekly / custom), start date, trial end date, notes, category.
- Smart presets: pick from a built-in catalog of common services (Netflix, Spotify, Adobe, ChatGPT, Amazon Prime, Disney+, Notion, Dropbox, etc.) which prefills typical price, cycle, cancel URL, and support email.
- Any preset field stays editable.

**Cancel flow (`/subscriptions/$id/cancel`)**
Two paths, both offered:
1. **Direct cancel link** — a big button that opens the service's actual cancellation page (deep link from the catalog), plus the known step-by-step path ("Account → Membership → Cancel Membership") so there is no FAQ digging.
2. **Cancellation email** — a pre-written cancellation request addressed to the service's support address, with your details filled in. Copy to clipboard or open in your mail client.

After either path, a "Mark as cancelled" action moves the subscription to cancelled and stops it counting toward spend.

**Gmail import (`/import`)**
- Connects your Gmail through the Gmail connector.
- Scans your inbox for receipts, trial-start confirmations, and renewal notices from known billing senders.
- AI reads the matched emails and extracts service name, amount, currency, billing cycle, and trial end date.
- Results appear as a review list — you tick which ones to import; nothing is added without your confirmation.
- Rescan on demand, with duplicate detection against what you already track.

## Data and accounts

- No login. Everything you save lives in this browser (local storage), so it loads instantly and stays private.
- The Gmail scan runs server-side only during a scan; extracted candidates come back to the browser and are only stored once you accept them.
- Clear caveat in the UI: data is per-browser, with export/import to JSON as a backup.

## Reminders

In-app only: countdown badges, a sorted "expiring soon" section, and a warning banner when any trial is inside 3 days. No email sending.

## Honest limitation

Nobody can truly one-click-cancel most services from outside — no provider exposes that. The cancel button does the next best thing: sends you straight to the real cancel page with the exact steps, or hands you a ready-to-send cancellation email.

## Design direction

Dark, calm finance-app look: deep charcoal surfaces, a single amber accent for warnings and a mint accent for savings, tabular numerals for money, generous card spacing. Mobile-first, since the current viewport is a phone. No purple gradients.

## Technical notes

- TanStack Start routes: `index`, `subscriptions.new`, `subscriptions.$id`, `subscriptions.$id.cancel`, `import`, each with its own head metadata.
- State: a `useSubscriptions` hook over `localStorage`, hydration-safe (read in effect), with zod-validated records.
- Catalog: a static `src/data/services.ts` with name, domain, typical price, cancel URL, cancel steps, support email; logos via Logo.dev-style domain URLs or initials fallback.
- Gmail: connect the Gmail connector, then a `createServerFn` that queries the Gmail API through the connector gateway (`messages.list` with a billing-sender/keyword query, then `messages.get`), passes snippets to the Lovable AI Gateway for structured extraction, and returns candidate subscriptions. No Lovable Cloud needed since nothing is persisted server-side.
- Cancellation email is generated client-side from a template plus catalog data.
