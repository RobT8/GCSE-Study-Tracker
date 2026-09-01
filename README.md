# GCSE Study Tracker

**Revision Compass** — a simple, private web app for tracking a GCSE student's
progress across every subject, topic and sub-topic, logging real test results,
and seeing at a glance where more work is needed.

## What it does

- **Accounts & sync** — sign in with an email and password; your data is stored
  securely in the cloud and follows you across every device. A local copy is
  kept as an offline cache so the app opens instantly.
- **Dashboard** — an overall mastery score, a rough "working around" grade, and
  a *needs attention* list of the weakest topics. A profile card shows each
  subject's **target grade** next to the grade he's currently tracking around.
- **Subjects** — organise the curriculum as **subjects → topics → sub-topics**.
  Rate how secure he is on each sub-topic (Weak / Learning / Secure / Mastered).
- **Tests** — log school tests and mocks (whole-subject or tagged to specific
  topics), with a per-subject trend sparkline. These carry the most weight in
  the mastery scores.

Mastery blends his **self-rating** with **real test evidence** (tests weigh
more) and rolls up sub-topic → topic → subject → overall, colour-coded on a
Red / Amber / Green scale.

## Running it

It's a single, self-contained HTML file — no build step. It's hosted on GitHub
Pages and talks directly to a Supabase backend for accounts and sync.

To share one student's data across devices (e.g. a parent's laptop and the
student's phone), sign in with the **same account** on each device.

## Backend

- **Supabase** provides authentication and a Postgres database.
- A single `app_state` table holds one JSON row per user, protected by
  Row-Level Security so each account can only read and write its own data.
- The Supabase URL and publishable anon key in `index.html` are safe to expose
  publicly — they only permit access allowed by the security policies.

## Roadmap

Done: **Phase 1** (tracker + test log) and **Phase 2** (accounts + cross-device
sync). Planned next:

1. **Quiz engine** — short, adaptive quizzes per sub-topic that feed the scores.
2. **Revision plan** — an auto-generated weekly timetable weighted to weak areas.
3. **Multiple students** — track more than one child under one account.
4. **AI content** — auto-generated questions and written-answer marking.

## Tech

Plain HTML, CSS and vanilla JavaScript; Supabase JS client via CDN. Light /
dark / system theming built in.
