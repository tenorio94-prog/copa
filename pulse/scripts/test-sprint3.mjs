/**
 * Validação Sprint 1.3 — Contexto otimizado + historical_context + team_form
 *
 * Testa o pipeline com prompt reduzido e novos campos.
 *
 * Uso:
 *   $env:DEEPSEEK_API_KEY='sk-...'; node scripts/test-sprint3.mjs
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

const POPULAR = ["brazil","argentina","germany","france","england","italy","netherlands","portugal","spain","uruguay"]
function isPop(n) { return POPULAR.some(t => n.toLowerCase().includes(t)) }
function isKO(s) { return s === "Mata-mata" || s === "Semifinal" || s === "Final" }
function mapStage(r) { const s = r.toLowerCase(); if (s.includes("quarter")) return "Mata-mata"; if (s.includes("round")) return "Mata-mata"; if (s.includes("semi")) return "Semifinal"; if (s.includes("final")) return "Final"; if (s.includes("group")) return "Fase de grupos"; return "Torneio" }

function detectFlags(m, st) {
  const f = []
  const hW = m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore
  const aW = m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore
  if (isKO(st)) f.push("high_stakes")
  if (hW) { if (!isPop(m.home) && isPop(m.away)) f.push("upset"); else if (isPop(m.home)) f.push("big_team_win") }
  if (aW) { if (isPop(m.home) && !isPop(m.away)) f.push("upset"); else if (isPop(m.away)) f.push("big_team_win") }
  if (m.homePens != null) { f.push("penalty_drama"); f.push("elimination") }
  if (m.homeScore != null && m.awayScore != null && m.homeScore + m.awayScore >= 5) f.push("blowout")
  if (isKO(st) && (hW || aW || m.homePens != null)) f.push("elimination")
  return f
}

function enrich(m, all) {
  const st = mapStage(m.round), fl = detectFlags(m, st)
  let winner = null, loser = null
  if (m.homePens != null) { winner = m.homePens > m.awayPens ? m.home : m.away; loser = m.homePens > m.awayPens ? m.away : m.home }
  else if (m.homeScore != null && m.awayScore != null) { winner = m.homeScore > m.awayScore ? m.home : m.awayScore > m.homeScore ? m.away : null; loser = m.homeScore < m.awayScore ? m.home : m.awayScore < m.homeScore ? m.away : null }
  const score = m.homeScore != null && m.awayScore != null ? `${m.homeScore}–${m.awayScore}` : "–"
  const penStr = m.homePens != null ? `${m.homePens}–${m.awayPens}` : null

  // Historical context
  const historicalContext = {
    first_african_semifinalist: (m.home === "Marrocos" || m.away === "Marrocos") && isKO(st),
    defending_champion: false, host_nation: false, years_since_last_title: null,
  }

  // Team form
  const tm = all.filter(x => x.home === m.home || x.away === m.home).sort((a,b) => a.date.localeCompare(b.date))
  const lostOpener = tm.length > 0 ? (tm[0].home === m.home ? (tm[0].homeScore ?? 0) < (tm[0].awayScore ?? 0) : (tm[0].awayScore ?? 0) < (tm[0].homeScore ?? 0)) : false
  let streak = 0
  for (let i = tm.length - 1; i >= 0; i--) {
    const x = tm[i], isH = x.home === m.home, s = isH ? x.homeScore : x.awayScore, c = isH ? x.awayScore : x.homeScore
    if (s != null && c != null && s >= c) streak++; else break
  }
  const totalWon = tm.filter(x => { const isH = x.home === m.home; return (isH ? x.homeScore : x.awayScore) > (isH ? x.awayScore : x.homeScore) }).length
  let momentum = "neutral"
  if (lostOpener && totalWon >= 2) momentum = "recovering"
  else if (totalWon === tm.length && tm.length >= 2) momentum = "dominant"
  else if (totalWon === 0 && tm.length >= 2) momentum = "struggling"
  const teamForm = { lost_opener: lostOpener, current_streak: streak, momentum }

  const stories = []
  if (fl.includes("penalty_drama")) stories.push({ type: "elimination", reason: "Eliminação nos pênaltis" })
  if (fl.includes("upset")) stories.push({ type: "underdog", reason: "Vitória surpreendente" })

  return {
    matchId: m.id, winner, loser, homeTeam: m.home, awayTeam: m.away,
    homeScore: m.homeScore, awayScore: m.awayScore, stage: st, round: m.round,
    score: penStr ? `${score} (pen: ${penStr})` : score, penaltyScore: penStr,
    competitionImpact: { eliminated: isKO(st) && loser ? loser : null, nextOpponent: null, qualified: isKO(st) && !!winner },
    narrativeFlags: fl,
    storyCandidates: stories,
    historicalContext,
    teamForm,
  }
}

// ─── LLM CALL ──────────────────────────────────────────────

function buildPrompt(e, memory) {
  const data = [{
    placar: `${e.homeTeam} ${e.score} ${e.awayTeam}`, vencedor: e.winner, perdedor: e.loser,
    fase: e.stage, rodada: e.round, eliminado: e.competitionImpact.eliminated,
    flags: e.narrativeFlags, story_candidates: e.storyCandidates.map(s => ({ type: s.type, reason: s.reason })),
    penalty: e.penaltyScore, historical_context: e.historicalContext, team_form: e.teamForm,
  }]
  let p = JSON.stringify(data, null, 2)
  if (memory) {
    const parts = []
    const j = Object.entries(memory.teamJourneys).map(([t, s]) => `${t}: ${s.join(" → ")}`).join("\n")
    if (j) parts.push("JORNADA DAS EQUIPES:\n" + j)
    if (memory.narratives.length) parts.push("CONTEXTO NARRATIVO:\n" + memory.narratives.join("\n"))
    const hc = Object.entries(memory.historicalContexts || {}).filter(([, v]) => v.first_african_semifinalist).map(([t]) => `${t}: primeira semifinalista africana`).join("\n")
    if (hc) parts.push("CONTEXTO HISTÓRICO:\n" + hc)
    if (parts.length) p += "\n\n" + parts.join("\n\n")
  }
  return p
}

const SYSTEM = `Você é o editor do Copa Pulse. Gere JSON com headline (até 15 palavras, verbo de ação), summary (1-2 frases), why_it_matters (consequência). Considere story_candidates, team_form, historical_context e contexto narrativo. NUNCA repetir placar no why_it_matters. NUNCA inventar informações. Responda APENAS em JSON: { "headline": string, "summary": string, "why_it_matters": string }`

async function callDeepSeek(prompt) {
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `Jogos:\n\n${prompt}` }], response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 500 }),
    })
    if (!res.ok) return null
    const j = await res.json(), c = j.choices?.[0]?.message?.content
    return c ? JSON.parse(c) : null
  } catch { return null }
}

// ─── TEMPLATES ─────────────────────────────────────────────

function tHead(e) {
  if (e.stage === "Final" && e.winner && e.penaltyScore) return `${e.winner} é campeão mundial nos pênaltis`
  if (e.stage === "Final" && e.winner) return `${e.winner} é campeão mundial`
  if (e.penaltyScore && e.winner) return `${e.winner} elimina ${e.loser} nos pênaltis`
  if (e.narrativeFlags.includes("upset")) return `${e.winner} surpreende ${e.loser}`
  if (e.winner && e.loser) return `${e.winner} elimina ${e.loser} e segue no torneio`
  return `${e.homeTeam} vs ${e.awayTeam}`
}
function tSum(e) {
  if (e.penaltyScore && e.winner && e.loser) return `${e.winner} venceu ${e.loser} nos pênaltis por ${e.penaltyScore} após ${e.homeScore}–${e.awayScore}.`
  if (e.stage === "Final" && e.winner && e.penaltyScore) return `${e.winner} é campeão mundial nos pênaltis.`
  if (e.winner && e.loser && e.stage !== "Fase de grupos") return `${e.winner} eliminou ${e.loser} e avançou.`
  if (e.narrativeFlags.includes("upset") && e.winner) return `${e.winner} venceu ${e.loser}.`
  return `${e.homeScore}–${e.awayScore}.`
}
function tWhy(e) {
  if (e.stage === "Final" && e.winner) return `${e.winner} é campeão mundial. ${e.loser} espera quatro anos.`
  if (e.penaltyScore && e.winner && e.loser) return `${e.loser} eliminado nos pênaltis.`
  if (e.competitionImpact.eliminated && e.winner) return `${e.loser} eliminado. ${e.winner} segue vivo.`
  return `Resultado impacta classificação.`
}

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║  Sprint 1.3 — Contexto otimizado + historical_context + form   ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")
  console.log()

  if (!process.env.DEEPSEEK_API_KEY) { console.log("❌ DEEPSEEK_API_KEY não configurada"); process.exit(0) }

  const summary = []

  for (const m of MATCHES) {
    const all = MATCHES.map(x => ({ ...x, status: "finished" }))
    const e = enrich({ ...m, status: "finished" }, all)
    const prompt = buildPrompt(e, null) // no memory for individual tests

    const template = { h: tHead(e), s: tSum(e), w: tWhy(e) }
    const ds = await callDeepSeek(prompt)

    console.log("─".repeat(72))
    console.log(`  ${m.home} ${m.homeScore}–${m.awayScore} ${m.away}  •  ${m.round}`)
    if (m.homePens != null) console.log(`  ⚡ Pênaltis: ${m.homePens}–${m.awayPens}`)
    console.log()
    console.log(`  Flags: ${e.narrativeFlags.join(", ")}`)
    console.log(`  Stories: ${e.storyCandidates.map(s => `${s.type}`).join(", ") || "—"}`)
    console.log(`  historical_context: first_african_semifinalist=${e.historicalContext.first_african_semifinalist}`)
    console.log(`  team_form: ${JSON.stringify(e.teamForm)}`)
    console.log()
    console.log(`  ── TEMPLATE ──`)
    console.log(`  Headline:    ${template.h}`)
    console.log(`  Summary:     ${template.s}`)
    console.log(`  Why Matters: ${template.w}`)
    console.log()
    if (ds) {
      console.log(`  ── DEEPSEEK (contexto otimizado) ──`)
      console.log(`  Headline:    ${ds.headline}`)
      console.log(`  Summary:     ${ds.summary}`)
      console.log(`  Why Matters: ${ds.why_it_matters}`)
      // Check hallucination risk
      const usesExtKnowledge = ds.why_it_matters && (
        ds.why_it_matters.includes("Messi") || ds.why_it_matters.includes("Mbappé") ||
        ds.why_it_matters.includes("primeira") && ds.why_it_matters.includes("africana") ||
        ds.why_it_matters.includes("36 anos")
      )
      if (usesExtKnowledge) console.log(`  ⚠️  Usou conhecimento externo (não fornecido nos dados)`)
    } else {
      console.log(`  ❌ DeepSeek falhou`)
    }

    summary.push({ match: m, template, deepseek: ds, flags: e.narrativeFlags, form: e.teamForm, hc: e.historicalContext })
    console.log()
  }

  console.log("═".repeat(72))
  console.log("📊  ANÁLISE")
  console.log("═".repeat(72))
  console.log()
  console.log(`  Contexto enviado por match (4 campos otimizados):`)
  console.log(`  • match_info (placar, vencedor, perdedor, fase)`)
  console.log(`  • narrative_flags (${["penalty_drama","upset","elimination","blowout","big_team_win","high_stakes"].join(", ")})`)
  console.log(`  • story_candidates (type + reason — sem score)`)
  console.log(`  • historical_context (first_african_semifinalist, defending_champion, etc)`)
  console.log(`  • team_form (lost_opener, current_streak, momentum)`)
  console.log()
  console.log(`  Removido do prompt:`)
  console.log(`  • simpleImpact.*     — nunca usado pela LLM`)
  console.log(`  • close_game         — sem impacto narrativo`)
  console.log(`  • big_team_loss      — upsert já cobre`)
  console.log(`  • storyCandidates[].score — LLM ignora números`)
  console.log()
  console.log(`  Riscos de alucinação:`)
  for (const s of summary) {
    if (s.deepseek && s.match.match !== "Marrocos") { // skip known case
      // Check if DeepSeek mentioned something not in data
      const mentionsExt = s.deepseek.why_it_matters &&
        (s.deepseek.why_it_matters.includes("Messi") ||
         s.deepseek.why_it_matters.includes("Mbappé"))
      if (mentionsExt) {
        console.log(`  ⚠️  ${s.match.home} ${s.match.homeScore}–${s.match.awayScore} ${s.match.away}: mencionou jogador não fornecido`)
      }
    }
  }
  console.log()
  console.log("═".repeat(72))
  console.log("✅  Validação concluída")
  console.log("═".repeat(72))
}

main().catch(console.error)
