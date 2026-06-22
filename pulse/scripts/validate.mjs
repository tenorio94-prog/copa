/**
 * Script de validação do sistema editorial.
 *
 * Uso:
 *   node scripts/validate.mjs
 *   API_FOOTBALL_KEY=x node scripts/validate.mjs 2022-12-18
 *   OPENAI_API_KEY=x API_FOOTBALL_KEY=x node scripts/validate.mjs 2022-12-18
 *
 * Testa o pipeline completo com jogos históricos.
 * Sem argumentos: usa dados mockados.
 * Com data: busca jogos da API-Football naquela data.
 * Com OPENAI_API_KEY: testa também a geração LLM.
 */

const LEAGUE_ID = process.env.API_FOOTBALL_LEAGUE_ID || "1"
const FOOTBALL_KEY = process.env.API_FOOTBALL_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY
const TARGET_DATE = process.argv[2] || ""

const POPULAR = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain", "uruguay",
]

function isPopular(name) {
  return POPULAR.some((t) => name.toLowerCase().includes(t))
}

function isKnockout(stage) {
  return stage === "Mata-mata" || stage === "Semifinal" || stage === "Final"
}

function mapStage(round) {
  const r = round.toLowerCase()
  if (r.includes("quarter")) return "Mata-mata"
  if (r.includes("round")) return "Mata-mata"
  if (r.includes("semi")) return "Semifinal"
  if (r.includes("final")) return "Final"
  if (r.includes("group")) return "Fase de grupos"
  return "Torneio"
}

function getFlag(name) {
  const flags = {
    brazil: "🇧🇷", spain: "🇪🇸", argentina: "🇦🇷", mexico: "🇲🇽",
    germany: "🇩🇪", japan: "🇯🇵", france: "🇫🇷", portugal: "🇵🇹",
    netherlands: "🇳🇱", uruguay: "🇺🇾", england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    italy: "🇮🇹", croatia: "🇭🇷", belgium: "🇧🇪", switzerland: "🇨🇭",
    poland: "🇵🇱", senegal: "🇸🇳", morocco: "🇲🇦", ghana: "🇬🇭",
    cameroon: "🇨🇲", serbia: "🇷🇸", "south korea": "🇰🇷",
    "saudi arabia": "🇸🇦", australia: "🇦🇺", canada: "🇨🇦",
    "costa rica": "🇨🇷", ecuador: "🇪🇨", "united states": "🇺🇸",
    wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", iran: "🇮🇷", tunisia: "🇹🇳",
    denmark: "🇩🇰", sweden: "🇸🇪", norway: "🇳🇴",
  }
  for (const [key, flag] of Object.entries(flags)) {
    if (name.toLowerCase().includes(key)) return flag
  }
  return "🏳️"
}

function detectFlags(m) {
  const flags = []
  const homeWon = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore
  const awayWon = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore

  if (isKnockout(m.stage)) flags.push("high_stakes")

  if (homeWon) {
    if (!isPopular(m.homeName) && isPopular(m.awayName)) flags.push("upset")
    else if (isPopular(m.homeName)) flags.push("big_team_win")
  }
  if (awayWon) {
    if (isPopular(m.homeName) && !isPopular(m.awayName)) flags.push("upset")
    else if (isPopular(m.awayName)) flags.push("big_team_win")
  }

  if (m.homeScore !== null && m.awayScore !== null) {
    const total = m.homeScore + m.awayScore
    if (total >= 5) flags.push("blowout")
    else if (total <= 2 && homeWon !== awayWon) flags.push("close_game")
  }
  if (isKnockout(m.stage) && (homeWon || awayWon)) flags.push("elimination")

  return flags
}

// ─── API-Football ──────────────────────────────────────────

async function fetchApi(path) {
  if (!FOOTBALL_KEY) return null
  try {
    const res = await fetch(`https://v3.football.api-sports.io${path}`, {
      headers: {
        "x-rapidapi-key": FOOTBALL_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

async function getMatches(date) {
  const fixtures = await fetchApi(`/fixtures?date=${date}&league=${LEAGUE_ID}&season=2026`)
  if (!fixtures?.response?.length) {
    const live = await fetchApi("/fixtures?live=all")
    return live?.response || []
  }
  return fixtures.response
}

// ─── Context Builder simplificado ──────────────────────────

function enrichMatch(f) {
  const score = f.goals.home !== null && f.goals.away !== null
    ? `${f.goals.home}–${f.goals.away}` : "–"
  const stage = mapStage(f.league.round)
  const homeScore = f.goals.home
  const awayScore = f.goals.away
  const homeName = f.teams.home.name
  const awayName = f.teams.away.name

  const winner = homeScore !== null && awayScore !== null
    ? homeScore > awayScore ? homeName : awayScore > homeScore ? awayName : null
    : null
  const loser = homeScore !== null && awayScore !== null
    ? homeScore < awayScore ? homeName : awayScore < homeScore ? awayName : null
    : null

  const m = { homeName, awayName, homeScore, awayScore, stage, round: f.league.round }
  const flags = detectFlags(m)

  return {
    placar: `${homeName} ${score} ${awayName}`,
    vencedor: winner,
    perdedor: loser,
    fase: stage,
    rodada: f.league.round,
    eliminado: isKnockout(stage) && loser ? loser : null,
    flags,
  }
}

// ─── LLM ────────────────────────────────────────────────────

async function callLLM(matches) {
  if (!OPENAI_KEY) return null

  const prompt = JSON.stringify(matches.slice(0, 5), null, 2)

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é um editor do Copa Pulse. Gere JSON com headline (até 15 palavras, verbo de ação), summary (1-2 frases), why_it_matters (consequência para o torcedor casual). Não repita o placar no why_it_matters.`,
          },
          { role: "user", content: `Jogos:\n\n${prompt}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    return content ? JSON.parse(content) : null
  } catch { return null }
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗")
  console.log("║   Copa Pulse — Validação Editorial      ║")
  console.log("╚══════════════════════════════════════════╝")
  console.log()

  let fixtures

  if (TARGET_DATE) {
    console.log(`📡 Buscando jogos de ${TARGET_DATE}...`)
    fixtures = await getMatches(TARGET_DATE)
    if (!fixtures || fixtures.length === 0) {
      console.log("⚠️  Nenhum jogo encontrado para esta data.")
      console.log("   (talvez a API key não esteja configurada ou a data seja inválida)")
      process.exit(0)
    }
  } else {
    console.log("📡 Usando fixture de exemplo (sem data = fallback manual)")
    console.log("   Passe uma data como argumento: node scripts/validate.mjs 2022-12-18")
    console.log()
    // Fallback: simulated matches like a real knockout day
    fixtures = [
      { fixture: { id: 1, date: "2026-06-21T13:00:00Z", status: { short: "FT", elapsed: null } },
        league: { round: "Quarter-finals" },
        teams: { home: { name: "Brazil" }, away: { name: "Spain" } },
        goals: { home: 3, away: 2 },
        score: { halftime: { home: 1, away: 1 } } },
      { fixture: { id: 2, date: "2026-06-21T16:00:00Z", status: { short: "FT", elapsed: null } },
        league: { round: "Group D - Matchday 3" },
        teams: { home: { name: "Argentina" }, away: { name: "Mexico" } },
        goals: { home: 0, away: 0 },
        score: { halftime: { home: 0, away: 0 } } },
      { fixture: { id: 3, date: "2026-06-21T19:00:00Z", status: { short: "FT", elapsed: null } },
        league: { round: "Group E - Matchday 3" },
        teams: { home: { name: "Germany" }, away: { name: "Japan" } },
        goals: { home: 4, away: 0 },
        score: { halftime: { home: 2, away: 0 } } },
    ]
  }

  const enriched = fixtures.map(enrichMatch)

  console.log("─".repeat(46))
  console.log("📊  CONTEXT BUILDER — Output")
  console.log("─".repeat(46))
  for (const e of enriched) {
    console.log()
    console.log(`  ${e.placar}`)
    console.log(`  Fase: ${e.fase} • ${e.rodada}`)
    console.log(`  Flags: ${e.flags.join(", ") || "nenhuma"}`)
    if (e.eliminado) console.log(`  Eliminado: ${e.eliminado}`)
    if (e.vencedor) console.log(`  Vencedor: ${e.vencedor}`)
  }

  console.log()
  console.log("─".repeat(46))
  console.log("🤖  LLM — Geração de Conteúdo")
  console.log("─".repeat(46))

  const llmResult = await callLLM(enriched)

  if (llmResult) {
    console.log()
    console.log(`  Headline:    ${llmResult.headline}`)
    console.log(`  Summary:     ${llmResult.summary}`)
    console.log(`  Why Matters: ${llmResult.why_it_matters}`)
    console.log()
    console.log("  ✅ LLM funcionou")
  } else {
    console.log()
    if (!OPENAI_KEY) {
      console.log("  ⚠️  OPENAI_API_KEY não configurada")
      console.log("     Pule a validação LLM ou configure a chave:")
      console.log("     $env:OPENAI_API_KEY='sk-...'; node scripts/validate.mjs")
    } else {
      console.log("  ⚠️  LLM retornou null (possível erro de API ou rede)")
    }
    console.log()
    console.log("  Usando fallback (templates):")
    for (const e of enriched.slice(0, 3)) {
      if (e.eliminado) {
        console.log(`  → ${e.perdedor} está fora da Copa. ${e.vencedor} segue vivo.`)
      } else if (e.flags.includes("upset")) {
        console.log(`  → Resultado surpreendente. Pode alterar os rumos do grupo.`)
      }
    }
  }

  console.log()
  console.log("─".repeat(46))
  console.log("✅  Validação concluída")
  console.log("─".repeat(46))
  console.log()
  console.log("  Para testar com dados reais:")
  console.log("  node scripts/validate.mjs 2022-12-18")
}

main().catch(console.error)
