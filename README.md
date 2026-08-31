# GCSE Study Tracker

**Revision Compass** — a simple, private web app for tracking a GCSE student's
progress across every subject, topic and sub-topic, logging real test results,
and seeing at a glance where more work is needed.

## What it does

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

It's a single, self-contained HTML file — no build step, no dependencies, no
server. Just open `index.html` in a browser, or host it anywhere static
(GitHub Pages, Netlify, etc.).

Data is saved in the browser's `localStorage`, so it stays on the device it was
entered on. The app ships with sample subjects and tests; use **Profile → Reset
all data to sample** to start fresh with real subjects.

## Roadmap

This is **Phase 1** (the tracker + test log). Planned next steps:

1. **Quiz engine** — short, adaptive quizzes per sub-topic that feed the scores.
2. **Revision plan** — an auto-generated weekly timetable weighted to weak areas.
3. **Accounts & sync** — logins and a hosted database so data follows the user
   across devices (and supports more than one child).
4. **AI content** — auto-generated questions and written-answer marking.

## Tech

Plain HTML, CSS and vanilla JavaScript. Light / dark / system theming built in.
