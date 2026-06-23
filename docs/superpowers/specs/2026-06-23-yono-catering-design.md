# Yono Catering — Design Spec

**Date:** 2026-06-23
**Status:** Approved (design), pending spec review

## 1. Context and Goals

Mr. Yono runs a small household catering operation and still tracks meals on
paper. Yono Catering replaces the paper with an installable, mobile-first PWA
where Yono posts **one menu per day** and a **small fixed group** of members
responds before a daily cutoff. The result is a live, accurate "what to buy and
cook" list for Yono.

**Success criteria**
- Yono can post/edit today's dish in seconds from his phone.
- Each member can accept the dish, swap it for something else, or add a note
  (e.g. "spicy") before the cutoff.
- Yono sees a live tally of who wants what, so he can shop and cook correctly.
- After the cutoff, responses lock so Yono can buy with confidence.
- Reminders nudge Yono ("What's today's menu?") and members ("Menu posted,
  respond before HH:MM") via browser push.

**Non-goals (deliberately cut — YAGNI)**
- No payments / billing.
- No multiple groups or public customer signup (single fixed household group).
- No email or SMS/WhatsApp (browser push only).
- No multi-meal days (one menu per day).
- No auth library (signed httpOnly cookie session is enough for ~3 users).

## 2. Roles

- **Yono (admin):** posts/edits the day's dish, sees the live response summary
  (shopping list), manages members, sets the cutoff time.
- **Member** (Raihan, Iqbal, …): responds to today's dish.

## 3. Core Interaction — the member response form

A member fills **one form** per day, which covers both motivating examples:

- **Want today's dish?** Yes / No
- If **No** → free-text field for the alternative (duck → "chicken").
- **Optional note** → free text ("spicy", "no chili", "extra rice").

Mapping to the examples:
- *Duck → chicken*: `wants = No`, `swapDish = "chicken"`.
- *Fried rice, make mine spicy*: `wants = Yes`, `note = "spicy"`.

Responses can be edited freely until the cutoff, then they lock.

## 4. Daily Flow

1. **Vercel Cron** fires at a configured time → web push to Yono:
   *"What's today's menu, Mr. Yono?"*
2. Yono posts the dish → web push to all members:
   *"Today: <dish>. Respond before <cutoff>."*
3. Members respond (yes / no+swap / note).
4. Yono's home shows a **live tally**, e.g. *"2 duck, 1 chicken · notes: Iqbal =
   spicy"* — his shopping/cooking list.
5. **Standing cutoff**: a single configured time (e.g. 08:00) applies every day.
   Yono may override it for a specific day. After the effective cutoff,
   responses are read-only.

## 5. Data Model (Postgres + Prisma)

Four tables.

**User**
- `id` (pk)
- `name` (unique) — used as username
- `pinHash` — hashed PIN
- `role` — `yono` | `member`
- `pushSubscription` — JSON, nullable (web push endpoint+keys)

**Menu**
- `id` (pk)
- `date` — date, unique (one menu per day)
- `dish` — text
- `note` — text, nullable (Yono's own note on the dish)
- `cutoffOverride` — time, nullable (overrides the standing cutoff for this day)
- `createdAt`

**Response**
- `id` (pk)
- `menuId` (fk → Menu)
- `userId` (fk → User)
- `wants` — boolean (accept the default dish or not)
- `swapDish` — text, nullable (the alternative when `wants = false`)
- `note` — text, nullable (preference like "spicy")
- `updatedAt`
- **unique (menuId, userId)** — one response per member per day

**Settings**
- single row
- `standingCutoff` — time (e.g. "08:00")
- `reminderTime` — time the daily cron pushes Yono (e.g. "07:00")

## 6. Screens (mobile-first)

1. **Login** — pick name from list + enter PIN.
2. **Member home** — today's dish card with the member's current status; the
   response form (yes/no/swap/note); a calendar to browse other days
   (read-only for past, editable for today before cutoff).
3. **Yono home** — set/edit today's dish + cutoff override; live response
   summary (tally + per-person notes); calendar.
4. **Settings** (Yono only) — standing cutoff time, reminder time, add/remove
   members (name + initial PIN).

## 7. Architecture

- **Next.js (App Router)**. Server Components for reads; **Server Actions** for
  all mutations (post menu, submit response, manage settings/members).
- **Prisma + Neon Postgres** (Vercel Marketplace, free tier).
- **Auth:** custom. Login verifies name + PIN (PIN stored hashed with bcrypt),
  sets a signed httpOnly cookie holding the user id + role. Middleware/proxy
  gates routes; Yono-only routes check role. No third-party auth library.
- **Push:** `web-push` with VAPID keys. On login/grant, the browser
  subscription is saved to `User.pushSubscription`. Sending push reads
  subscriptions and POSTs notifications.
- **Cron:** **Vercel Cron** hits a route handler daily at `reminderTime` to push
  Yono the "What's today's menu?" reminder. Posting a menu triggers the
  member push inline (in the Server Action).
- **PWA:** `manifest.json` + a minimal service worker (required for web push
  and home-screen install).

### Unit boundaries
- `lib/auth.ts` — session cookie sign/verify, current-user helper.
- `lib/push.ts` — VAPID setup, `sendPush(userIds, payload)`.
- `lib/db.ts` — Prisma client singleton.
- `lib/cutoff.ts` — effective cutoff + "is locked now?" logic (pure, testable).
- Server Actions in route folders, thin — delegate to the libs above.

## 8. Error Handling

- **Past cutoff:** response mutations re-check the lock server-side and reject
  with a clear message ("Responses are locked for today"). UI also disables the
  form, but the server is the source of truth.
- **Duplicate menu for a day:** unique constraint on `Menu.date`; posting again
  edits the existing row.
- **Push failures:** a failed/expired subscription is caught per-user; on `410
  Gone` the stored subscription is cleared. One member's push failure never
  blocks the menu post.
- **Auth:** invalid PIN → generic "wrong name or PIN". Missing/expired cookie →
  redirect to login. Non-Yono hitting a Yono route → redirect home.
- **Validation at trust boundaries:** dish required and non-empty; swapDish
  required when `wants = false`; times validated as `HH:MM`.

## 9. Neobrutalism UI

- **Tokens:** primary yellow `#FDC800`, secondary purple `#432DD7`, surface
  warm `#FBFBF9`, text `#1C293C`; success `#16A34A`, warning `#D97706`, danger
  `#DC2626`. Font: **Inter** (via `next/font`). Type scale 13/15/17/21/27/35.
  Spacing 4/8/12/16/24/32.
- **Look:** thick black borders (2–3px), hard offset drop shadows (no blur),
  flat fills, high contrast. Buttons/cards shift on press to mimic the offset.
- **States:** every interactive element defines default / hover / focus-visible
  (visible outline) / active / disabled / loading. WCAG 2.2 AA contrast.
- **Accessibility:** keyboard-first, visible focus rings, semantic HTML,
  labelled form fields, no color-only signaling.

## 10. Testing

- `lib/cutoff.ts` — unit tests for "is locked now?" across standing cutoff,
  per-day override, and timezone edges.
- `lib/auth.ts` — sign/verify round-trip and tamper rejection.
- Response Server Action — rejects when past cutoff; enforces swapDish-when-No.
- Manual smoke: post menu → member responds → Yono summary updates → cutoff
  locks.

## 11. Lazy Defaults (ponytail) — reversible on request

- Calendar uses a native month grid / `<input type="date">`, not a calendar lib.
- Plain signed cookie auth, not an auth library.
- Member swap is free text, not a curated dish picker.
- Single fixed timezone (the household's), not per-user timezones.
