# Business Case Generator — FairPlay Sports Media

A multi-step, AI-assisted business case tool that generates `.docx` files formatted to the FPSM Level 1/2/3 template. Built with Next.js, deployed on Vercel, powered by Claude.

---

## Features

- **Quick Generate** — describe your initiative in 2–3 sentences, Claude fills every section instantly
- **Draft with AI** — per-field AI drafting with streaming output; add an optional brief to guide the tone
- **Strategic Alignment table** — toggle objectives with free-text explanations
- **Download .docx** — client-side generation matching the FPSM template structure

---

## Setup: Git → Vercel

### 1. Create a new GitHub repository

```bash
git init
git add .
git commit -m "Initial commit — FPSM Business Case Generator"

# Create repo on GitHub (empty, no README), then:
git remote add origin https://github.com/YOUR_ORG/biz-case-generator.git
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → select your repo
3. Vercel auto-detects Next.js — leave build settings as default
4. **Before deploying**, add this Environment Variable:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

5. Click **Deploy** — live in ~60 seconds

Every `git push` to `main` triggers an automatic redeploy.

---

## Local Development

```bash
npm install
```

Create `.env.local` (never commit this):
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout + Google Fonts
    page.tsx                # Multi-step form UI with AI integration
    globals.css             # Design tokens + component styles
    api/
      generate/route.ts     # POST /api/generate — full case from prompt
      draft/route.ts        # POST /api/draft — streaming per-field drafting
  lib/
    generateDocx.ts         # .docx generation (docx.js), FPSM template
```

---

## API Routes

### `POST /api/generate`
Generates all fields from a single brief (Quick Generate modal).

### `POST /api/draft`
Streams content for one field (Draft with AI buttons).

Both routes run on Vercel Edge. The `ANTHROPIC_API_KEY` is server-side only — never exposed to the browser.

---

## Extending

To add Level 2/3 or Final Additions fields:
1. Add steps to `STEPS` in `page.tsx`
2. Extend `BusinessCaseData` in `generateDocx.ts`
3. Add sections to `generateBusinessCase()`
4. Add prompts to `FIELD_PROMPTS` in `api/draft/route.ts`
