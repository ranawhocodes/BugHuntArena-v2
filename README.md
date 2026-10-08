# 🐛 BugWug

> **Hunt bugs. Level up. Hatch legends.**
> An arena where AI creates the bugs and the learner hunts them down.

[![CI](https://github.com/ranawhocodes/BugHuntArena/actions/workflows/ci.yml/badge.svg)](https://github.com/ranawhocodes/BugHuntArena/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Antigravity](https://img.shields.io/badge/Built%20with-Antigravity-4285F4)](https://antigravity.google)

🔗 **[Live Demo on Vercel](https://bug-hunt-arena.vercel.app)** · 📝 **[LinkedIn Announcement Post](docs/linkedin-post.md)** · 📦 **[GitHub Repository](https://github.com/ranawhocodes/BugHuntArena)**

---

## ✨ What's New in BugWug

- **Personalised from the first minute** — onboarding asks *“How much debugging have you done?”* (**New to debugging** / **Some experience**). The answer drives puzzle order in the Arena (Easy-first vs Medium-first), the Daily Hunt pool, and the difficulty requested from the AI generator. Learners can switch tracks any time in their Profile.
- **Every account sees only its own data** — progress is cached per user id (`bugwug:v1:<userId>`), the app state is keyed by account, the old shared browser key is purged, and all local/cloud save data is validated and normalised before use. Supabase RLS isolates rows server-side.
- **Resume where you left off** — the Arena opens on your first unsolved puzzle, shows `n solved`, marks solved puzzles, and *Next Hunt* jumps to the next unsolved one.
- **Daily Hunt that survives a refresh** — cleared steps are saved per day and synced, with spoken + visible feedback on every attempt.
- **Skill Breakdown** — Profile lists every bug category you have solved with its clean-catch rate, weakest first, so you know what to practise.
- **Safe sign-out** — from the top bar or Profile; the latest progress is flushed to the cloud before the session ends.
- **Pixel design system** — square, editorial UI with the Streamline *Pixel* icon set (CC BY 4.0); the code workspace keeps its original look.

---

## 🌟 The Core Vision

Beginners learning to code spend over 60% of their time stuck on obscure syntax errors, off-by-one loops, and type mismatches. Most platforms just give the answer away or present overwhelming, multi-file codebases.

**BugWug** turns debugging into a tactical creature-hunting game. Tailored for school students and first-year beginners in **Python** and **JavaScript**, every challenge is designed around three fundamental answers to the hackathon challenge:

### 1. Fair & Fun
* **Single-bug guarantee:** Every program has exactly **one bug** on a single line. No confusing compound bugs.
* **Side-by-side terminal:** Compare actual broken logs directly against expected output.
* **Named Bug Creatures:** Every bug squashed captures a personality-filled creature (e.g. *Sliceworm*, *Indexo*, *Nullbite*, *Scopegeist*) into your Bug Dex.

### 2. Hints That Teach (Never Spoil)
* **Tier 1 (Where to look):** Directs the learner's mental spotlight to the relevant concept.
* **Tier 2 (Why it happens):** Explains the underlying language mechanism without revealing the fix.
* **Tier 3 (Strategy):** Suggests the concrete refactoring approach so the learner still writes the code.

### 3. Coming Back Tomorrow
* **Deterministic Daily Hunt:** 3 fresh puzzles every midnight based on a deterministic mathematical seed.
* **Streak Flame & Shields:** Earn freeze shields to protect your active streaks across busy days.
* **Living SVG Pet Companion:** Feed and groom your companion pet (Fire Beetle, Byte Moth, or Glitch Hound) who reacts to your debugging victories and evolves across 4 stages!
* **The Bug Dex:** Complete all 24 bug species and collect 10 distinct Hunter achievement badges.

---

## 🏛️ Technical Architecture

Built from the ground up for speed, zero dependencies, and robust offline capability:

```
bugwug/
├── api/                  # Vercel serverless function (Gemini 1.5 Flash adapter)
├── docs/                 # Implementation plan, progress logs, LinkedIn post
├── scripts/              # Guardrail scripts (check-secrets, check-repo, presubmit)
├── src/
│   ├── ai/               # Client-side AI generator with automatic offline fallback
│   ├── app/              # Hash router, AppShell, and AppState context
│   ├── components/       # Accessible UI (CodeViewer, OutputPanel, Pet, Modals)
│   ├── content/          # 24 verified puzzles (12 Python, 12 JS) & pure validator
│   ├── engine/           # Pure game formulas (XP, Level, Streak, Mulberry32 PRNG)
│   ├── highlight/        # Custom zero-dependency regex tokenizer
│   ├── screens/          # Home, Arena, Daily, PetDen, Profile, About
│   ├── storage/          # Resilient localStorage manager with corruption recovery
│   └── styles/           # Modern design tokens (Dark mode default + Light theme)
└── tests/                # 61 automated Vitest unit, component, and a11y tests
```

### ⚡ Performance & Bundle Metrics
- **Runtime dependencies:** `react`, `react-dom` and `@supabase/supabase-js` only.
- **Client JS bundle:** ~165 KB gzipped (most of it is `supabase-js`; app code is small).
- **Client CSS bundle:** ~11 KB gzipped.
- **Vite build time:** < 1 s.
- **Engine test coverage:** **98.2% lines / 90.9% branches** (Exceeds ≥ 80% hackathon scoring criteria).

---

## 🔐 Supabase Authentication & Cloud Progress Sync

BugWug includes full user authentication and persistent cloud progress backed by Supabase:
- **Authentication Gate:** Users and jury members can sign up with their email and password or sign in to resume their progress from any device.
- **Continuous Cloud Sync:** Puzzles solved, levels, XP, streaks, unlocked badges, and pet states automatically sync to the database with debounced upsert operations.
- **Row Level Security (RLS):** Every player's save state is isolated and protected with PostgreSQL RLS policies in `supabase/schema.sql`.
- **Offline / Local Fallback:** When running locally without Supabase keys, the app seamlessly falls back to local storage without crashing.

---

## 🤖 AI Bug Generation & Offline Fallback

BugWug features a hybrid architecture:
1. **Google Gemini Live Generation:** An optional serverless endpoint (`api/generate-bug.ts`) dynamically crafts fresh, structured coding challenges in JSON using `gemini-1.5-flash`.
2. **Offline Curated Bank:** 24 handcrafted, verified puzzles across 10 core bug categories ensuring the platform works 100% offline or if the API key is not supplied.
3. **Safety & Secrets:** Zero API keys are stored in client code or in the repository. The application safely runs in full functionality with or without `LLM_API_KEY`.

---

## 🐾 Parametric SVG Pet Companion

The pet companion is rendered using **100% pure inline SVG** — no binary images, canvas, or external assets:
- **3 Species:** Fire Beetle 🔥, Byte Moth ⚡, Glitch Hound 🐕
- **4 Evolution Stages:** Baby ➔ Junior ➔ Veteran ➔ Mythic
- **5 Dynamic Moods:** `idle`, `happy`, `thinking`, `alert`, `sleepy`
- **Cosmetics Wardrobe:** Wizard Hat, Cyber Visor, Slayer Crown
- **Accessibility:** Fully supports `prefers-reduced-motion` and keyboard triggers.

---

## 🛠️ Local Development & Quality Gates

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

### Setup
```bash
# Clone the repository
git clone https://github.com/ranawhocodes/BugHuntArena.git
cd BugHuntArena

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Presubmit Quality Gates
Before any commit or submission, the full quality gate script enforces:
```bash
npm run presubmit
```
1. 🔒 **Secret scan:** Verifies zero leaked API keys or credentials.
2. 🌿 **Branch check:** Enforces single `main` branch policy and repo budget (< 8 MB).
3. 🧹 **ESLint:** Strict TypeScript, React Hooks, JSX accessibility rules (`max-warnings 0`).
4. 📐 **Typecheck:** Zero `any` types under TypeScript strict mode.
5. 🧪 **Vitest:** 83 unit and integration tests passing.
6. 📦 **Production build:** Validates bundle compilation.
7. 🛡️ **Audit:** Zero known vulnerabilities in npm dependencies.

---

## 📜 Problem Alignment & Scoring Mapping

| Hackathon Criterion | BugWug Implementation |
|---|---|
| **Code Quality** | Strict TypeScript (zero `any`), ESLint incl. `jsx-a11y` and React Hooks rules, pure engine functions, design tokens instead of hard-coded styles. |
| **Security** | No secrets in the repo or client; Gemini key sent in a header (never in URLs); API body + model name validated; per-IP rate limit; internal errors never echoed; AI puzzles schema-validated; local/cloud saves sanitised; per-account storage isolation + Supabase RLS; email/name validation on sign-up. |
| **Efficiency** | Three runtime deps; debounced cloud writes; memoised puzzle ordering; inline SVG icons (no icon font); no redundant re-fetching of saves. |
| **Testing** | 83 tests: engine, storage resilience, **cross-account isolation**, save-data sanitisation, experience tracks, onboarding (incl. keyboard), API input guards + rate limit, components and full Arena loop. |
| **Accessibility** | Semantic landmarks (single `main`), skip link, radio-group semantics with arrow-key support, keyboard-operable cards (Enter/Space), `aria-live` feedback, visible 2px focus rings, WCAG AA text contrast in both themes, reduced-motion support. |
| **Problem Alignment** | Debugging practice that adapts to the learner's experience, remembers progress per account, and shows which bug types still need work. |

---

## 📄 License

MIT License — Created for the Developer Hackathon.
Built with ❤️ using **Google Antigravity**.
