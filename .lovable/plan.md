# InterviewReady AI — Build Plan

A light-themed, interactive web app that turns a resume + job description into a personalized 1-page interview prep brief using AI.

## Scope (v1, no-auth)

Anyone can use the app without signing in. History is stored locally in the browser (localStorage) so Sarah can revisit past briefs from the same device. Auth is intentionally deferred but the data model and UI are structured so it can be added later without rework.

## Screens & Flow

```text
[1] Upload  ──►  [2] Loading  ──►  [3] Brief Output
   ▲                                       │
   └──────────── [4] History ◄─────────────┘
                    │
                    └──► open any past brief
```

### 1. Upload screen
- Two side-by-side cards: **Resume** and **Job Description**
- Each card supports: file upload (PDF, DOCX, DOC, TXT) via drag-and-drop or click, OR a "Paste text" tab
- Short explainer: "We'll analyze both to build your personalized prep brief"
- Primary CTA: **Generate Prep Brief** (disabled until both inputs provided)
- Top-right: link to **History** and **Settings** (for optional API key)

### 2. Loading screen
- Animated progress indicator with staged status messages:
  - "Reading your resume…"
  - "Understanding the role…"
  - "Spotting strengths and gaps…"
  - "Drafting your playbook…"
- Rotating interview tips while waiting
- Cancel button

### 3. Brief output screen (the playbook)
A clean, printable 1-page layout with these sections:
- **Header**: Role, company (if detected), date generated
- **Snapshot**: 2–3 line summary of fit
- **Question Bank**: prioritized list (High / Medium priority badges)
- **Suggested Answers**: tailored, STAR-style draft per top question, expandable
- **Red Flag Detector**: gaps/mismatches with a "how to address" tip for each
- **Key Talking Points**: bullet list of strengths to emphasize
- Action buttons: **Download PDF**, **Print**, **Copy to clipboard**, **Save to history** (auto-saved), **Regenerate**, **New brief**

### 4. History screen
- List of saved briefs (role, company, date, snippet)
- Click to reopen full brief
- Delete and rename actions
- Empty state with CTA to create first brief

### Settings (modal or small page)
- Optional input: "Your OpenAI / Anthropic API key (optional)"
- Helper text: "Leave blank to use the built-in Universal Key"
- Stored locally only; never sent anywhere except the AI call
- Toggle for which provider the custom key is for

## AI Behavior

A single backend edge function takes resume text + JD text (+ optional user key/provider) and returns a structured JSON brief using tool-calling so the output is reliably shaped:

```text
{
  snapshot, questions[{q, priority, category}],
  suggested_answers[{question, answer}],
  red_flags[{gap, how_to_address}],
  talking_points[]
}
```

Default model: Lovable AI (Universal Key, Gemini Flash). If the user provided their own key in Settings, the function uses that provider instead.

## Design

- **Theme**: light, airy, friendly, interactive
- Soft neutrals with one warm accent color, rounded cards, subtle shadows, smooth transitions
- Mobile responsive
- Micro-interactions: hover lifts on cards, animated checkmarks as loading stages complete, expandable answer sections

## Future-ready hooks (built in, not exposed yet)
- Auth slot: a thin `useUser()` abstraction returning `null` in v1; swap to real auth later
- History storage abstracted behind a small interface so it can move from localStorage → database when auth ships
- Settings page already supports custom API keys (OpenAI / Anthropic)

## Technical notes
- Frontend: React + Tailwind + shadcn/ui, react-router for the 4 routes (`/`, `/loading`, `/brief/:id`, `/history`, `/settings`)
- File parsing in the browser: `pdfjs-dist` for PDFs, `mammoth` for DOCX, plain read for TXT; `.doc` (legacy binary) is best-effort with a fallback prompt to paste text
- Backend: Lovable Cloud + one edge function `generate-brief` calling the Lovable AI Gateway with structured tool-calling output; supports an optional user-supplied key/provider passed in the request body
- PDF export of brief via `html2pdf.js` or print stylesheet
- History persisted to `localStorage` under a versioned key

## Out of scope for v1
- User accounts / cloud sync of history
- Multiple resumes / company research scraping
- Mock interview chat (could be a v2)
