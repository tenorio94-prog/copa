/**
 * Validação Sprint 1.4 — HistoricalContextBuilder (5 fatos)
 *
 * Compara: Context Builder atual vs Context Builder + HistoricalContextBuilder
 *
 * Uso:
 *   $env:DEEPSEEK_API_KEY='sk-...'; node scripts/test-sprint4.mjs
 */

const MATCHES = [
  { id: "1", date: "2022-11-22", home: "Argentina", away: "Arábia Saudita",
    homeScore: 1, awayScore: 2, htHome: 1, htAway: 0, round: "Group C - Matchday 1" },
  { id: "2", date: "2022-11-23", home: "Alemanha", away: "Japão",
    homeScore: 1, awayScore: 2, htHome: 1, htAway: 0, round: "Group E - Matchday 1" },
  { id: "6", date: "2022-12-09", home: "Croácia", away: "Brasil",
    homeScore: 1, awayScore: 1, homePens: 4, awayPens: 2, htHome: 0, htAway: 0,
    round: "Quarter-finals" },
  { id: "8", date: "2022-12-10", home: "Marrocos", away: "Portugal",
    homeScore: 1, awayScore: 0, htHome: 1, htAway: 0, round: "Quarter-finals" },
  { id: "12", date: "2022-12-18", home: "Argentina", away: "França",
    homeScore: 3, awayScore: 3, homePens: 4, awayPens: 2, htHome: 2, htAway: 0,
    round: "Final" },
]

const AFRICAN_NATIONS = ["marrocos","senegal","cameroon","ghana","nigeria","tunisia","algeria","egypt","south africa","ivory coast"]
const POPULAR = ["brazil","argentina","germany","france","england","italy","netherlands","portugal","spain","uruguay"]
function isPop(n) { return POPULAR.some(t => n.toLowerCase().includes(t)) }
function isAfrican(n) { return AFRICAN_NATIONS.some(t => n.toLowerCase().includes(t)) }
function isKO(s) { return s === "Mata-mata" || s === "Semifinal" || s === "Final" }
function mapStage(r) { const s = r.toLowerCase(); if (s.includes("quarter")) return "Mata-mata"; if (s.includes("round")) return "Mata-mata"; if (s.includes("semi")) return "Semifinal"; if (s.includes("final")) return "Final"; if (s.includes("group")) return "Fase de grupos"; return "Torneio" }

// ─── KNOWLEDGE BASE ───────────────────────────────────────

const FK = {
  Brazil: { titles: 5, rank: 1, lastTitle: 2002 },
  Germany: { titles: 4, rank: 11, lastTitle: 2014 },
  Italy: { titles: 4, rank: null, lastTitle: 2006 },
  Argentina: { titles: 3, rank: 3, lastTitle: 1986 },
  France: { titles: 2, rank: 4, lastTitle: 2018 },
  Uruguay: { titles: 2, rank: 14, lastTitle: 1950 },
  England: { titles: 1, rank: 5, lastTitle: 1966 },
  Spain: { titles: 1, rank: 10, lastTitle: 2010 },
  Netherlands: { titles: 0, rank: 8, lastTitle: null },
  Croatia: { titles: 0, rank: 12, lastTitle: null },
  Portugal: { titles: 0, rank: 9, lastTitle: null },
  Belgium: { titles: 0, rank: 7, lastTitle: null },
  Morocco: { titles: 0, rank: 22, lastTitle: null },
  Japan: { titles: 0, rank: 24, lastTitle: null },
  "Saudi Arabia": { titles: 0, rank: 51, lastTitle: null },
  Mexico: { titles: 0, rank: 13, lastTitle: null },
}

function kn(name) {
  const k = Object.keys(FK).find(k => name.toLowerCase().includes(k.toLowerCase()))
  return k ? FK[k] : { titles: 0, rank: null, lastTitle: null }
}

// ─── CONTEXT BUILDER ──────────────────────────────────────

function buildMatch(m, all) {
  const st = mapStage(m.round)
  let winner = null, loser = null
  if (m.homePens != null) { winner = m.homePens > m.awayPens ? m.home : m.away; loser = m.homePens > m.awayPens ? m.away : m.home }
  else if (m.homeScore != null && m.awayScore != null) { winner = m.homeScore > m.awayScore ? m.home : m.awayScore > m.homeScore ? m.away : null; loser = m.homeScore < m.awayScore ? m.home : m.awayScore < m.homeScore ? m.away : null }
  const score = m.homeScore != null && m.awayScore != null ? `${m.homeScore}–${m.awayScore}` : "–"
  const penStr = m.homePens != null ? `${m.homePens}–${m.awayPens}` : null
  const hW = m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore
  const aW = m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore
  const flags = []
  if (isKO(st)) flags.push("high_stakes")
  if (hW) { if (!isPop(m.home) && isPop(m.away)) flags.push("upset"); else if (isPop(m.home)) flags.push("big_team_win") }
  if (aW) { if (isPop(m.home) && !isPop(m.away)) flags.push("upset"); else if (isPop(m.away)) flags.push("big_team_win") }
  if (m.homePens != null) { flags.push("penalty_drama"); flags.push("elimination") }
  if (isKO(st) && (hW || aW || m.homePens != null)) flags.push("elimination")

  return { id: m.id, winner, loser, homeTeam: m.home, awayTeam: m.away, stage: st, round: m.round, score: penStr ? `${score} (pen: ${penStr})` : score, penaltyScore: penStr, narrativeFlags: flags, competitionImpact: { eliminated: isKO(st) && loser ? loser : null, qualified: isKO(st) && !!winner } }
}

// ─── HISTORICAL FACTS ────────────────────────────────────

function detectFacts(m, e) {
  const facts = []
  const { winner, loser, stage } = e

  // 1. first_african_semifinalist — detect at quarter-final win (qualifies for semi)
  if (stage === "Mata-mata" && winner) {
    const african = [e.homeTeam, e.awayTeam].find(t => isAfrican(t) && t === winner)
    if (african) facts.push({ id: "first_african_semifinalist", w: 95, desc: `${african} é a primeira seleção africana a chegar em uma semifinal de Copa` })
  }

  // 2. giant_killing
  if (winner && loser) {
    const wr = kn(winner).rank, lr = kn(loser).rank
    if (wr && lr && (lr - wr) >= 15) facts.push({ id: "giant_killing", w: 85, desc: `${winner} (${wr}º) venceu ${loser} (${lr}º) — diferença de ${lr - wr} posições` })
  }

  // 3. years_since_last_title — applies to both teams in final, and to winner in any knockout
  for (const t of [winner, loser].filter(Boolean)) {
    const lt = kn(t).lastTitle
    if (lt && lt < 2026) {
      const years = 2026 - lt
      if (years >= 8) facts.push({ id: "years_since_last_title", w: years > 20 ? 95 : 80, desc: `${t} não vencia a Copa desde ${lt} — há ${years} anos` })
    }
  }

  // 4. defending_champion_eliminated
  if (e.competitionImpact.eliminated && loser) {
    const lt = kn(loser).lastTitle
    if (lt && (2026 - lt) <= 8) facts.push({ id: "defending_champion_eliminated", w: 85, desc: `${loser}, atual campeã mundial (${lt}), foi eliminada` })
  }

  // 5. streak_broken
  if (stage === "Fase de grupos" && e.narrativeFlags.includes("upset") && loser && isPop(loser)) {
    facts.push({ id: "streak_broken", w: 80, desc: `${loser} teve sua sequência invicta quebrada` })
  }

  return facts
}

// ─── PROMPTS ──────────────────────────────────────────────

function promptWithoutFacts(e) {
  return JSON.stringify([{ placar: `${e.homeTeam} ${e.score} ${e.awayTeam}`, vencedor: e.winner, perdedor: e.loser, fase: e.stage, flags: e.narrativeFlags, penalty: e.penaltyScore }], null, 2)
}

function promptWithFacts(e, facts) {
  const data = [{ placar: `${e.homeTeam} ${e.score} ${e.awayTeam}`, vencedor: e.winner, perdedor: e.loser, fase: e.stage, flags: e.narrativeFlags, penalty: e.penaltyScore }]
  const factsBlock = facts.sort((a, b) => b.w - a.w).map(f => `  • ${f.desc}`).join("\n")
  return JSON.stringify(data, null, 2) + "\n\nFATOS HISTÓRICOS:\n" + factsBlock
}

const SYS = "Você é editor do Copa Pulse. Gere JSON: headline (até 15 palavras, ação), summary (1-2 frases), why_it_matters (consequência). NUNCA repetir placar no why_it_matters. NUNCA inventar informações. JSON: { headline, summary, why_it_matters }"

async function callDS(prompt) {
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: SYS }, { role: "user", content: `Jogos:\n\n${prompt}` }], response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 500 }),
    })
    if (!res.ok) return null
    const j = await res.json(), c = j.choices?.[0]?.message?.content
    return c ? JSON.parse(c) : null
  } catch { return null }
}

// ─── MAIN ─────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║  Sprint 1.4 — HistoricalContextBuilder (5 fatos)               ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")
  console.log()

  if (!process.env.DEEPSEEK_API_KEY) { console.log("❌ Chave não configurada"); process.exit(0) }

  const summary = []

  for (const m of MATCHES) {
    const all = MATCHES.map(x => ({ ...x, status: "finished" }))
    const e = buildMatch({ ...m, status: "finished" }, all)
    const facts = detectFacts(m, e)

    const pBase = promptWithoutFacts(e)
    const pFacts = promptWithFacts(e, facts)

    const dsBase = await callDS(pBase)
    const dsFacts = await callDS(pFacts)

    summary.push({ match: m, facts, base: dsBase, factsResult: dsFacts })

    console.log("─".repeat(72))
    console.log(`  ${m.home} ${m.homeScore}–${m.awayScore} ${m.away}  •  ${m.round}`)
    if (facts.length > 0) {
      console.log()
      console.log(`  📜 FATOS DETECTADOS:`)
      for (const f of facts) {
        console.log(`     [${f.w}] ${f.desc}`)
      }
    } else {
      console.log(`  📜 Nenhum fato detectado`)
    }
    console.log()
    if (dsBase) {
      console.log(`  ── SEM FATOS ──`)
      console.log(`  Headline:    ${dsBase.headline}`)
      console.log(`  Summary:     ${dsBase.summary}`)
      console.log(`  Why Matters: ${dsBase.why_it_matters}`)
    }
    console.log()
    if (dsFacts) {
      console.log(`  ── COM FATOS ──`)
      console.log(`  Headline:    ${dsFacts.headline}`)
      console.log(`  Summary:     ${dsFacts.summary}`)
      console.log(`  Why Matters: ${dsFacts.why_it_matters}`)
    }
    console.log()
  }

  // ─── ANÁLISE ────────────────────────────────────────────

  console.log("═".repeat(72))
  console.log("📊  ANÁLISE COMPARATIVA")
  console.log("═".repeat(72))
  console.log()

  let improved = 0
  for (const s of summary) {
    const b = s.base, f = s.factsResult
    if (!b || !f) { console.log(`  ⚠️  ${s.match.home} vs ${s.match.away}: comparação incompleta`); continue }

    const baseLen = (b.headline + b.summary + b.why_it_matters).length
    const factsLen = (f.headline + f.summary + f.why_it_matters).length
    const moreSpecific = factsLen > baseLen && s.facts.length > 0
    const usedFact = s.facts.length > 0 && (
      f.headline.toLowerCase().includes(s.facts[0].desc.split(" ")[0].toLowerCase()) ||
      f.why_it_matters.includes("primeira") || f.why_it_matters.includes("ranking") ||
      f.why_it_matters.includes("invicta") || f.why_it_matters.includes("campeã") ||
      f.why_it_matters.includes("anos")
    )

    if (usedFact || moreSpecific) {
      improved++
      console.log(`  ✅ ${s.match.home} ${s.match.homeScore}–${s.match.awayScore} ${s.match.away}: DeepSeek usou os fatos`)
    } else {
      console.log(`  ⚠️  ${s.match.home} ${s.match.homeScore}–${s.match.awayScore} ${s.match.away}: fatos não influenciaram`)
    }
  }

  console.log()
  console.log(`  Fatos influenciaram: ${improved}/${summary.length} jogos`)
  console.log(`  Próximo passo: ${improved >= 3 ? "✅ Implementar Tier B" : "⏸️ Revisar detecção de fatos"}`)
  console.log()
  console.log("═".repeat(72))
  console.log("✅  Validação concluída")
  console.log("═".repeat(72))
}

main().catch(console.error)
