# The Bottleneck Method™ — AI Diagnostic

An executive-grade business diagnostic tool that combines a structured
assessment, a deterministic scoring engine, and Claude-powered synthesis to
identify the single biggest constraint holding a business back — and what to
do about it in the next 90 days.

This is a portfolio and consulting demonstration asset. It is a fully working
MVP, not a prototype: submit a real assessment and it produces a genuinely
different report for a genuinely different business.

---

## 1. Project Overview

Users land on a single page, describe their business and answer 12
structured questions across four categories, and receive a polished,
printable "Bottleneck Diagnostic" report: an executive summary, a scorecard,
a primary root cause, secondary constraints, prioritized recommendations, a
90-day roadmap, and where AI/automation genuinely fits.

There is no login, no database, and no dashboard. Every run is stateless —
answers live in the browser for the duration of the session, and the report
is generated fresh from the Anthropic API on each submission.

## 2. The Business Problem

Most small and mid-sized businesses don't have a growth problem — they have
a bottleneck problem. Revenue is capped not by market size but by one
specific internal constraint: undocumented processes, an owner who is the
delivery mechanism, unclear pricing, or a team that can't make decisions
without routing through the top. Owners usually sense *something* is wrong
but default to generic fixes (more marketing, more headcount) that don't
address the actual constraint.

## 3. The Solution

A structured, repeatable diagnostic:

1. Collect business context and 12 targeted questions (8 numeric, 4 open-text)
   across Revenue Engine, Operations & Delivery, People & Organization, and
   Systems & Growth Readiness.
2. Calculate an objective 2–10 scorecard for each category using a fixed,
   auditable formula — no AI involved.
3. Hand the scorecard plus the user's own words to Claude, instructed to act
   as a senior management consultant: separate symptoms from root causes,
   ground every claim in the specific answers given, and produce a
   structured, decisive report.
4. Present the result as a document an executive would actually read, and
   let them print or save it as a PDF on the spot.

## 4. The Bottleneck Method™ Framework

Four categories, two numeric questions and one open-text question each:

| Category | Numeric Questions | Open Question |
|---|---|---|
| **Revenue Engine** | Pricing confidence · Lead source diversification | Where deals stall |
| **Operations & Delivery** | Process documentation · Key-person dependency | Last operational break |
| **People & Organization** | Role clarity · Decision independence | Hire that unlocks capacity |
| **Systems & Growth Readiness** | Systems maturity · Data access speed | What breaks first at 2x revenue |

Each category score is `((answer1 + answer2) / 2) * 2`, producing a 2–10
scale. The two open-text answers per category aren't scored — they exist so
the AI has concrete, specific language to ground its analysis in, instead of
producing generic advice.

## 5. Why Deterministic Scoring Is Separated From AI Synthesis

This is the core architectural decision in the project, and it's
non-negotiable: **the AI never calculates or alters a score.**

- [`src/lib/scoring.ts`](src/lib/scoring.ts) is a pure, dependency-free
  TypeScript function. Given the same eight numeric answers, it always
  returns the same four scores. It is unit-tested directly
  ([`scoring.test.ts`](src/lib/scoring.test.ts)) covering all-1s, all-5s,
  mixed answers, missing fields, non-numeric input, and out-of-range values.
- The API route calls this function *before* it ever talks to Claude, and
  passes the resulting scores into the prompt as fixed facts the model must
  use verbatim.
- After Claude responds, the server **overwrites** whatever score values
  the model returned with the deterministic ones
  ([`src/app/api/diagnose/route.ts`](src/app/api/diagnose/route.ts)) before
  the response ever reaches the browser.

The reason: LLMs are excellent at synthesis and narrative, and unreliable at
consistent arithmetic under prompt pressure. A diagnostic tool that claims to
score a business needs those scores to be reproducible, explainable, and
immune to prompt drift. The AI's job is to explain *why* a given score is
what it is in the business owner's own language — not to invent the number.

## 6. User Flow

```
Landing  →  Business Context & Assessment  →  Processing  →  Executive Report
   ↑                                                              │
   └───────────────────── Start New Diagnostic ←──────────────────┘
```

If the API call fails or the model returns something that doesn't validate,
the user is returned to the assessment screen with every answer intact, an
explanation of what went wrong, and a retry option — never a blank form.

## 7. Technology Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Anthropic Claude API** (`@anthropic-ai/sdk`), called server-side only
- **Zod** for runtime schema validation of both the incoming submission and
  the AI's JSON response
- **Vitest** for unit and integration tests
- Browser-native `window.print()` with a dedicated print stylesheet — no
  PDF generation library, no charting library
- No database, no authentication, no external state

## 8. Local Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 9. Environment Variables

See [`.env.example`](.env.example).

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Server-side only. Never sent to the browser. |
| `ANTHROPIC_MODEL` | No | Overrides the default model (`claude-sonnet-5`). |

## 10. Vercel Deployment

1. Push this repository to GitHub (see below).
2. In Vercel, click **Add New → Project** and import the repository.
3. Framework preset: **Next.js** (auto-detected).
4. Under **Environment Variables**, add `ANTHROPIC_API_KEY` with your key.
   Do not add it to `NEXT_PUBLIC_*` — it must stay server-side.
5. Deploy. No build configuration changes are required.

## GitHub Upload Instructions

```bash
git add -A
git commit -m "Initial commit: Bottleneck Method AI Diagnostic MVP"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 11. Current MVP Scope

In scope:
- Single-session, stateless diagnostic (no persistence, no accounts)
- Deterministic scoring + AI-generated narrative and recommendations
- Print-to-PDF via the browser
- Full client- and server-side validation
- Graceful handling of API failures and malformed AI output, with a retry

Explicitly out of scope (by design):
- Authentication, user accounts, or saved history
- A database of any kind
- Payments, billing, or usage limits
- Multi-user or team functionality
- Benchmarking against other companies or industries
- A charting library — scorecard bars are plain CSS

## 12. Future Enhancements

- Optional PDF generation via a headless renderer for pixel-perfect exports
- Save/share a report via a signed, expiring link (would require storage)
- Multi-language support
- A lightweight admin view for reviewing anonymized aggregate question
  distributions (would require storage and would need to be opt-in)

## 13. What This Project Demonstrates

- Structuring an ambiguous business problem into a repeatable, scorable
  framework
- Separating deterministic business logic from probabilistic AI synthesis,
  and enforcing that boundary at the code level rather than by prompting
  alone
- Designing a strict, validated contract (Zod) between an LLM and a
  production system, with graceful degradation when the contract is broken
- Writing an executive-tone system prompt that produces decisive, grounded
  output without overclaiming certainty
- Shipping a complete, tested, deployable product rather than a demo script

## 14. Screenshots

_Add screenshots of the landing page, assessment form, and generated report
here before sharing this repository publicly._

- `docs/screenshot-landing.png`
- `docs/screenshot-assessment.png`
- `docs/screenshot-report.png`

## 15. Responsible Use

This tool produces a **directional** diagnostic based entirely on
self-reported answers to twelve questions. It is a prioritization aid, not
an audit. It is not a substitute for financial, legal, tax, or operational
due diligence, and it should not be the sole basis for a material business
decision. Treat the output as a structured starting point for a
conversation, not a verdict.
