# Roadmap

- [x] Email reminders for trial/renewal dates (7d, 3d, 1d, day-of) — engine built 2026-09-22 (`src/lib/reminders.server.ts` + `/api/reminders/cron`); needs RESEND_API_KEY + verified domain + cron secret to actually send
- [x] Simple login (email/password + Google) so reminders can be sent — verified working (auth.tsx, useAuth)
- [ ] Sync subscriptions to the database per user (migrate local data)
- [x] Daily scheduled job that sends due reminders — `.github/workflows/reminder-sweep.yml` (13:00 UTC); needs GitHub secrets configured
- [ ] Optional browser push notifications (Firebase)
- [ ] Answer user: confirm Gmail access is private to their account only
