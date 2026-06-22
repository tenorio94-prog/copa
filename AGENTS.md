# Copa Pulse — AGENTS.md

## Project structure

```
copa/
├── pulse/                          # Next.js 13 app (App Router)
│   ├── app/                        # pages + layout
│   ├── components/                 # React components
│   ├── lib/                        # business logic
│   │   ├── llm/                    # LLM providers (DeepSeek, OpenAI)
│   │   ├── types.ts                # all shared interfaces
│   │   ├── context-builder.ts      # match enrichment pipeline
│   │   ├── editorial-story-engine.ts # story selection
│   │   ├── historical-context-builder.ts
│   │   ├── narrative-accumulation.ts
│   │   ├── narrative-tracker.ts
│   │   ├── next-chapter.ts
│   │   ├── story-brief.ts
│   │   ├── tournament-memory.ts
│   │   ├── mock-data.ts            # data fetching + orchestration
│   │   └── ...                     # transformers, templates, knowledge base
│   ├── scripts/                    # validation CLI scripts
│   └── .env.local                  # API keys (not committed)
├── spec-*.html                     # product design docs
└── world-cup-pulse-plan.html       # original product plan
```

## Commands

All commands run from `pulse/`.

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build (runs typecheck) |
| `npm run lint` | ESLint |
| `node scripts/validate.mjs` | Test editorial pipeline with historical data |
| `node scripts/test-deepseek.mjs` | Test DeepSeek LLM integration |

## Data flow (editorial pipeline)

```
API-Football (or mock data)
  ↓
context-builder.ts → EnrichedMatch[]
  ↓
editorial-story-engine.ts → EditorialStory[] (ranked by confidence)
  ↓
story-brief.ts → StoryBrief (3 bullets + continuity)
  ↓
next-chapter.ts → NextChapter (retention hook)
  ↓
narrative-tracker.ts → ActiveNarrative[] (tracked arcs)
  ↓
components → homepage
```

## Key types (lib/types.ts)

- `EditorialStory` — output of story engine (headline, confidence, evidence, storyType)
- `StoryBrief` — 15s consumption unit (3 bullets, continuity bar)
- `NextChapter` — retention hook (openQuestion, nextEvent)
- `ActiveNarrative` — tracked arc visibility (currentChapter, status)
- `EnrichedMatch` — match enriched with flags, arcs, facts

## LLM providers

Two interchangeable providers in `lib/llm/`:
- **DeepSeek** (default) — set `LLM_PROVIDER=deepseek`, key in `DEEPSEEK_API_KEY`
- **OpenAI** — set `LLM_PROVIDER=openai`, key in `OPENAI_API_KEY`

All content generation goes through `generateBulletinContent()` in `lib/llm/index.ts`. Templates in `templates.ts` serve as fallback when no LLM key is configured.

## Editorial scoring principle

The `EditorialStoryEngine` uses `confidence` (0-1) as the single metric. There is no weighted score formula. Higher confidence = better story. Confidence is boosted by: editorial events, narrative arcs, historical facts, stage of tournament, penalty drama, upsets.

## Homepage component order (as implemented)

```
ContinuityBar → QuickRead → NextChapter → NarrativeTracker → Hero → Matches → Standings
```

Desktop sidebar: `Matches → NarrativeTracker → Standings → Footer`

## Environment (pulse/.env.local)

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
API_FOOTBALL_KEY=
API_FOOTBALL_LEAGUE_ID=1
```

## Trivia

- Tailwind CSS v3 (not v4). Config is `tailwind.config.js` (CommonJS), not `.ts`.
- PostCSS config is `postcss.config.js` (CommonJS).
- Node.js 18.14.0 is the runtime. Next.js 13. `next.config.ts` → renamed to `next.config.mjs`.
- The `.env.local` file is read by Next.js automatically. Standalone Node scripts do NOT read it — use `$env:VAR=value node script.mjs` on Windows.
- `lib/mock-data.ts` is the data orchestration hub. It tries API-Football, falls back to hardcoded data.
- All spec documents (`spec-*.html`) are visual reference docs. The app itself is in `pulse/`.
- `restore-optimization.ps1`, `Bacalhau à Martelo.pdf`, `Capa_Bacalhau_a_Martelo.docx` are unrelated to the project.
