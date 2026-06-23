# Copa Pulse — AGENTS.md

**Always read `docs/PROJECT_MEMORY.md` first** for full context. This file is a quick-start reference.

---

## First thing to know

This product has **never been tested with real users**. The codebase is complete enough for U1 validation. Do NOT propose new features, datasets, components, or architectural changes before U1 is done. Read `docs/PROJECT_MEMORY.md` before any action — especially section 16 (Validation Plan), section 20 (Open Questions), and section 22 (IMPORTANT RULES).

---

## Project structure

```
copa/
├── pulse/                          # Next.js 13 app (App Router)
│   ├── app/                        # pages + layout
│   ├── components/                 # React components
│   ├── lib/                        # business logic
│   │   ├── llm/                    # LLM providers (DeepSeek, OpenAI)
│   │   ├── editorial-story-engine.ts  # central story selection
│   │   ├── mock-data.ts               # data orchestration hub
│   │   └── types.ts                   # all shared interfaces
│   ├── data/                       # historical datasets (JSON)
│   ├── scripts/                    # validation CLI scripts
│   └── .env.local                  # API keys (gitignored)
├── docs/                           # permanent project memory
│   └── PROJECT_MEMORY.md           # SOURCE OF TRUTH (25 sections)
├── spec-*.html                     # product design docs (read-only reference)
└── AGENTS.md                       # this file
```

## Commands (run from `pulse/`)

| Command | Purpose | Notes |
|---|---|---|
| `npm run dev` | Start dev server | Hot reload |
| `npm run build` | Build + typecheck | Only typecheck path (no separate script). **EPERM bug**: if it fails, delete `.next/` and retry |
| `npm run lint` | ESLint (flat config `eslint.config.mjs`) | Runs `eslint` directly, not `next lint` |
| `node scripts/validate.mjs` | Test editorial pipeline | Mock data by default; optional date arg → API-Football |
| `node scripts/test-2022.mjs` | Comprehensive 2022 WC test | 10+ historical games; tests LLM if `OPENAI_API_KEY` set |
| `node scripts/test-deepseek.mjs` | Test DeepSeek LLM | Needs env var on Windows |
| `$env:DEEPSEEK_API_KEY='...'; node scripts/score-facts.mjs` | Test with real LLM | Env must be set inline |
| `node scripts/test-arcs.mjs` | Test narrative arcs | Sprint 1.7; needs `DEEPSEEK_API_KEY` |
| `node scripts/test-sprint2.mjs` | Test narrative memory + penalties | Compara antes/depois |
| `node scripts/test-sprint3.mjs` | Test optimized context | Needs `DEEPSEEK_API_KEY` |
| `node scripts/test-sprint4.mjs` | Test HistoricalContextBuilder | Needs `DEEPSEEK_API_KEY` |

## Build cache quirk (Windows)

Next.js `.next/` cache frequently causes `EPERM: operation not permitted` on Windows. Fix:
```powershell
Remove-Item -Path ".next" -Recurse -Force; npx next build
```

## LLM configuration

Two interchangeable providers in `lib/llm/`:
- **DeepSeek** (default) — `LLM_PROVIDER=deepseek`, key in `DEEPSEEK_API_KEY`
- **OpenAI** — `LLM_PROVIDER=openai`, key in `OPENAI_API_KEY`

Without any key, `templates.ts` acts as fallback with static text.

## Homepage order (mobile)

```
ContinuityBar → QuickRead → NextChapter → HeroMini → NarrativeTracker → Matches → Standings
```

Desktop sidebar: `Matches → NarrativeTracker → Standings (groups only) → Footer`

Standings only render during group stage.

## Key types (lib/types.ts)

- `EditorialStory` — engine output (headline, confidence 0-1, evidence[], priority 1-3)
- `StoryBrief` — 15s consumption unit (3 bullets + continuity)
- `NextChapter` — retention hook (openQuestion + nextEvent)
- `ActiveNarrative` — tracked arc (currentChapter, status)

## Data flow (editorial pipeline)

```
API-Football (or mock data) → context-builder → tournament-memory
  → editorial-story-engine → story-brief → next-chapter → narrative-tracker
  → components → homepage
```

## Historical datasets (pulse/data/)

- `teams.json` — 39 teams with titles, finals, best result, continent
- `world-cup-history.json` — all 22 World Cup editions (1930-2022)

## Historical facts implemented (10)

Detected by `historical-context-builder.ts`. Each boosts confidence in `editorial-story-engine.ts`:
`first_african_semifinalist`, `giant_killing`, `years_since_last_title`, `defending_champion_eliminated`, `streak_broken`, `first_title_ever`, `title_drought_ended`, `repeat_final`, `back_to_back_final`, `best_result_surpassed`.

## Narrative arcs implemented (4)

Detected by `narrative-accumulation.ts`: `redemption_journey`, `cinderella_progression`, `giant_slayer`, `multi_upset_run`.

## Environment (pulse/.env.local)

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...          # configured, working
DEEPSEEK_MODEL=deepseek-chat
OPENAI_API_KEY=                  # optional fallback
OPENAI_MODEL=gpt-4o-mini
API_FOOTBALL_KEY=                # NOT CONFIGURED — $99/yr, only after validation
API_FOOTBALL_LEAGUE_ID=1
```

## Trivia

- **Tailwind CSS v3** (not v4). Config is `tailwind.config.js` (CommonJS).
- **PostCSS** is `postcss.config.js` (CommonJS).
- **Next.js 13.5**, React 18. Config is `next.config.mjs` (ESM).
- **Import alias**: `@/*` maps to `pulse/` root (e.g. `@/lib/mock-data` → `pulse/lib/mock-data.ts`). Defined in `tsconfig.json`.
- `.env.local` is read by Next.js automatically. **Standalone scripts do NOT read it** — pass vars inline on Windows: `$env:VAR=value node script.mjs`
- `lib/mock-data.ts` is the orchestration hub. Tries API-Football, falls back to hardcoded fallback data.
- `.next/` is NOT in `.gitignore` — the EPERM workaround (delete cache) is safe because it's ephemeral.
- **`spec-*.html` files** are product design docs (read-only). The app is in `pulse/`.
- **API-Football key is NOT configured.** For U1 validation, mock data is sufficient. If real data needed before paying, use `football-data.org` (free).
