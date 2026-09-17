# ResumeForge AI — One-Page ATS Resume Tailor

Paste a job description, analyze your resume against it, and generate a truthful,
one-page, ATS-readable resume tailored to that specific job — with a transparent,
evidence-based alignment score instead of a fake "100% ATS match" promise.

## What's actually implemented

Everything below runs **with no API key required**, using a fully deterministic,
rule-based engine (`lib/ai/provider.ts` → `MockAIProvider`):

- **Resume input**: paste text, upload `.txt`/`.docx` (via `mammoth`), or `.pdf`
  (extracted client-side in the browser via `pdfjs-dist` for reliability, with
  a server-side fallback)
- **Job description analysis**: extracts job title, seniority, years of experience,
  required vs. preferred vs. contextual requirements, tools, frameworks,
  certifications, responsibilities, and "hidden signals" (on-call, fast-paced, etc.)
- **Keyword matching**: exact + semantic matching (stemmed token overlap, so
  "monitor SIEM alerts...security incidents" is recognized as evidence for
  "Security Monitoring" even without that literal phrase)
- **ATS scoring engine**: 8 weighted, configurable components (keyword coverage,
  required skills match, experience relevance, achievement evidence, role
  alignment, skills alignment, ATS parseability, content quality), each with a
  plain-English explanation of *why* the score is what it is
- **Resume tailoring**: terminology alignment (e.g. resume's "risk analysis" →
  "security risk analysis" when the job requires that phrasing — but only ever
  expanding language the resume already contains, never inventing new claims),
  bullet/skill reprioritization toward job relevance, all with change-note
  tracking for the before/after comparison view
- **One-page enforcement**: a render-and-measure loop that actually renders the
  PDF, counts its real pages, and trims progressively harder until it's a
  verified single page — not just a text-based estimate (see below)
- **Fact-check layer**: flags any skill/tool term or metric that appears in the
  current resume but has no trace in the original, unless the user has
  explicitly confirmed it through the "Do you actually have this skill?" flow
- **Export**: PDF (`@react-pdf/renderer`, pure-JS, serverless-friendly, exactly
  one page with selectable text) and DOCX (`docx` library), across 3 ATS-safe
  templates (Classic, Modern ATS, Compact Technical)
- **Version history**: local, in-session snapshots with view/restore/duplicate

An **optional** `AnthropicAugmentedProvider` will call the real Anthropic API
(if `AI_API_KEY` is set) to phrase a few *additional* improvement suggestions
more naturally — but it never touches scoring, matching, tailoring, or claim
validation, and it falls back to the deterministic suggestions if the call
fails for any reason. Nothing about this product invents resume content.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Visit `http://localhost:3000`. Click **Start Tailoring**, then either paste your
resume, upload a file, or click **Try a sample** to explore the whole workflow
with placeholder data.

### Environment variables

```env
# Optional. Enables AI-phrased improvement suggestions only.
# Everything else works with no key set.
AI_API_KEY=
AI_MODEL=claude-sonnet-4-5
```

### Scripts

```bash
npm run dev     # local development
npm run build   # production build (must pass before deploying)
npm run start   # run the production build locally
npm run lint    # next lint
npm run test    # vitest — 29 tests covering scoring, matching, tailoring,
                # one-page trimming, claim validation, and text parsing
```

## Deploying to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In Vercel, **Import Project** and select the repo. Framework preset:
   **Next.js** (auto-detected).
3. If you want AI-phrased suggestions, add `AI_API_KEY` and `AI_MODEL` under
   **Settings → Environment Variables**. This step is optional — the app is
   fully functional without it.
4. Deploy. No database, no build-time secrets, no persistent filesystem
   dependency — this project is designed for stateless serverless execution.

## Architecture

```
app/
  page.tsx                 Landing page
  dashboard/page.tsx        Main application shell
  api/
    analyze-job/            POST job description text → JobAnalysis
    parse-resume/           POST file upload → structured Resume
    tailor-resume/          POST resume + job → tailored Resume + change notes
    validate-resume/        POST current + original resume → unsupported claims
    suggestions/            POST score/job/resume → short improvement tips
    fit-resume/             POST resume + job → verified one-page-fitted Resume
    export-pdf/             POST resume + template → PDF file (verified 1 page)
    export-docx/            POST resume + template → DOCX file

components/
  dashboard/                 All dashboard UI (editor, preview, score, keywords,
                              compare, version history, export modal)
  ui/                        Small shared primitives (Button, Card, ScoreGauge)

lib/
  ai/provider.ts             AIProvider interface + Mock/Anthropic-augmented impls
  job/analyzeJobDescription.ts   Rule-based JD extraction
  ats/keywordMatch.ts         Exact + semantic keyword evidence matching
  ats/scoring.ts               Weighted ATS scoring engine
  resume/tailor.ts             Terminology alignment + prioritization
  resume/onePage.ts            Fast heuristic line estimation (preview badge)
  resume/deeperTrim.ts          Escalating trim levels for the fitting loop
  resume/claimValidation.ts    Unsupported-claim ("fact check") detection
  parsing/                     File-format adapters (txt/docx/pdf) + text parser
  parsing/clientPdfExtract.ts   Browser-side PDF text extraction (pdfjs-dist)
  export/                      PDF (react-pdf) and DOCX (docx) generation
  export/fitOnePage.ts          Render-measure-trim loop (ground-truth 1-page fit)
  export/pdfPageCount.ts        Counts real pages of a rendered PDF
  domain/dictionary.ts         Curated skills/tools/certs dictionary + synonyms
  validation/schemas.ts        Zod schemas for every API request

types/                        Resume, JobAnalysis, ATS score/claim types
tests/                        Vitest unit tests + fixture job descriptions
```

### Why real-time scoring doesn't hit an API

Editing the resume recalculates the ATS score entirely client-side
(`lib/ats/scoring.ts` has no server dependency), debounced ~500ms so typing
stays smooth. No network round-trip, no AI call, no cost — matching the
product principle that alignment scoring must be transparent and free to
recompute as often as the user wants. The heavier operations (job analysis,
tailoring, fact-checking, optional AI suggestions) go through the
`/api/*` routes and the `AIProvider` abstraction, since those are the points
where a real LLM could plausibly add value later without changing the
architecture.

## Known limitations (by design, given scope)

- **Job/resume parsing is heuristic**, not a full NLP pipeline. It's tuned to
  handle common resume/JD formatting conventions well, and the resume editor
  lets the user immediately correct anything it gets wrong.
- **Persistence is intentionally local-only** for this MVP (version history and
  all state live in the browser tab). The architecture (Zod-validated,
  stateless API routes) is ready to add Supabase/Postgres later without
  rework, but no database is required to deploy or use the app.
- **UI fonts use system font stacks** (no external font loading) so the build
  has zero network dependency and stays fast — this is a deliberate deployability
  choice, not an oversight.

## How PDF upload and one-page fitting actually work

Two things that are easy to get subtly wrong in a project like this got a
second, more rigorous pass:

**PDF text extraction.** Server-side PDF text extraction (`pdf-parse`, which
wraps `pdf.js`) is unreliable for real-world resumes in a serverless Node
environment — PDFs with embedded/custom-encoded fonts (extremely common in
exports from Word, Google Docs, and design tools) need font/cmap data that's
awkward to supply outside a real browser. So PDF uploads are now extracted
**client-side** first, using `pdfjs-dist` — the same engine Chrome/Firefox use
for their built-in PDF viewers — with its worker, cmaps, and standard font
data self-hosted under `/public` (copied automatically from
`node_modules/pdfjs-dist` via `scripts/copy-pdfjs-assets.mjs`, wired into
`postinstall`, so it stays in sync on every `npm install`, including on
Vercel). If client-side extraction fails for any reason, it falls back to the
server-side path.

**One-page fitting.** The character-counting heuristic (`lib/resume/onePage.ts`)
is a fast, free, client-side estimate — but a text-based estimate can't
perfectly predict real rendered layout. So the *authoritative* fit check
(`lib/export/fitOnePage.ts`) actually renders the PDF, counts its real pages,
and — if it's more than one — trims progressively harder (5 escalating levels,
in `lib/resume/deeperTrim.ts`, never touching contact info) and re-renders,
repeating until it's a verified single page. This same function backs PDF
export, DOCX export (which reuses its resulting resume content), and a
debounced `/api/fit-resume` call that keeps the live preview showing exactly
what you'll actually download — not just an estimate of it.

## Disclaimer shown in-product

> ATS scores are estimates. Different applicant tracking systems use different
> parsing and ranking methods. This score measures alignment against the
> supplied job description and resume content; it does not guarantee an
> interview or application outcome.

And on privacy:

> Your resume is your personal data. This application does not require
> permanent storage of your resume for the core tailoring workflow.
