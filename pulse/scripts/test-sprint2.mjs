/**
 * Teste Sprint 1.2 — Validação com Memória Narrativa + Pênaltis
 *
 * Compara resultados ANTES vs DEPOIS das correções.
 *
 * Uso:
 *   node scripts/test-sprint2.mjs
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY

// ─── SAME 12 MATCHES FROM 2022 ─────────────────────────────

const MATCHES = [
  { id: "1", date: "2022-11-22", home: "Argentina", away: "Arábia Saudita",
    homeScore: 1, awayScore: 2, htHome: 1, htAway: 0,
    round: "Group C - Matchday 1", stageGuess: "Fase de grupos" },
  { id: "2", date: "2022-11-23", home: "Alemanha", away: "Japão",
    homeScore: 1, awayScore: 2, htHome: 1, htAway: 0,
    round: "Group E - Matchday 1", stageGuess: "Fase de grupos" },
  { id: "3", date: "2022-12-01", home: "Japão", away: "Espanha",
    homeScore: 2, awayScore: 1, htHome: 0, htAway: 1,
    round: "Group E - Matchday 3", stageGuess: "Fase de grupos" },
  { id: "4", date: "2022-11-28", home: "Coreia do Sul", away: "Gana",
    homeScore: 2, awayScore: 3, htHome: 0, htAway: 2,
    round: "Group H - Matchday 2", stageGuess: "Fase de grupos" },
  { id: "5", date: "2022-12-05", home: "Brasil", away: "Coreia do Sul",
    homeScore: 4, awayScore: 1, htHome: 4, htAway: 0,
    round: "Round of 16", stageGuess: "Mata-mata" },
  { id: "6", date: "2022-12-09", home: "Croácia", away: "Brasil",
    homeScore: 1, awayScore: 1, homePens: 4, awayPens: 2, htHome: 0, htAway: 0,
    round: "Quarter-finals", stageGuess: "Mata-mata" },
  { id: "7", date: "2022-12-09", home: "Holanda", away: "Argentina",
    homeScore: 2, awayScore: 2, homePens: 3, awayPens: 4, htHome: 0, htAway: 1,
    round: "Quarter-finals", stageGuess: "Mata-mata" },
  { id: "8", date: "2022-12-10", home: "Marrocos", away: "Portugal",
    homeScore: 1, awayScore: 0, htHome: 1, htAway: 0,
    round: "Quarter-finals", stageGuess: "Mata-mata" },
  { id: "9", date: "2022-12-10", home: "Inglaterra", away: "França",
    homeScore: 1, awayScore: 2, htHome: 0, htAway: 1,
    round: "Quarter-finals", stageGuess: "Mata-mata" },
  { id: "10", date: "2022-12-13", home: "Argentina", away: "Croácia",
    homeScore: 3, awayScore: 0, htHome: 2, htAway: 0,
    round: "Semi-finals", stageGuess: "Semifinal" },
  { id: "11", date: "2022-12-14", home: "França", away: "Marrocos",
    homeScore: 2, awayScore: 0, htHome: 1, htAway: 0,
    round: "Semi-finals", stageGuess: "Semifinal" },
  { id: "12", date: "2022-12-18", home: "Argentina", away: "França",
    homeScore: 3, awayScore: 3, homePens: 4, awayPens: 2, htHome: 2, htAway: 0,
    round: "Final", stageGuess: "Final" },
]

// ─── SAME CONTEXT BUILDER AS lib/context-builder.ts ────────

const POPULAR = ["brazil","argentina","germany","france","england","italy","netherlands","portugal","spain","uruguay"]
function isPop(n) { return POPULAR.some(t => n.toLowerCase().includes(t)) }
function isKO(s) { return s === "Mata-mata" || s === "Semifinal" || s === "Final" }
function mapStage(r) { const s = r.toLowerCase(); if (s.includes("quarter")) return "Mata-mata"; if (s.includes("round")) return "Mata-mata"; if (s.includes("semi")) return "Semifinal"; if (s.includes("final")) return "Final"; if (s.includes("group")) return "Fase de grupos"; return "Torneio" }

function detectFlags(m, st) {
  const f = []
  const hW = m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore
  const aW = m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore
  const d  = m.homeScore != null && m.awayScore != null && m.homeScore === m.awayScore
  if (isKO(st)) f.push("high_stakes")
  if (hW) { if (!isPop(m.home) && isPop(m.away)) f.push("upset"); else if (isPop(m.home)) f.push("big_team_win") }
  if (aW) { if (isPop(m.home) && !isPop(m.away)) f.push("upset"); else if (isPop(m.away)) f.push("big_team_win") }
  if (d && (isPop(m.home) || isPop(m.away))) f.push("big_team_loss")
  if (m.homePens != null) { f.push("penalty_drama"); f.push("elimination") }
  if (m.homeScore != null && m.awayScore != null) {
    const t = m.homeScore + m.awayScore
    if (t >= 5) f.push("blowout")
    else if (t <= 2 && !d) f.push("close_game")
  }
  if (isKO(st) && (hW || aW || m.homePens != null)) f.push("elimination")
  return f
}

function enrich(m) {
  const st = mapStage(m.round)
  const fl = detectFlags(m, st)
  // winner/loser with penalty support
  let winner = null, loser = null
  if (m.homePens != null) {
    winner = m.homePens > m.awayPens ? m.home : m.away
    loser  = m.homePens > m.awayPens ? m.away : m.home
  } else if (m.homeScore != null && m.awayScore != null) {
    winner = m.homeScore > m.awayScore ? m.home : m.awayScore > m.homeScore ? m.away : null
    loser  = m.homeScore < m.awayScore ? m.home : m.awayScore < m.homeScore ? m.away : null
  }
  const score = m.homeScore != null && m.awayScore != null ? `${m.homeScore}–${m.awayScore}` : "–"
  const penStr = m.homePens != null ? `${m.homePens}–${m.awayPens}` : null
  const stories = []
  if (fl.includes("penalty_drama")) stories.push({ type: "elimination", score: 95, reason: "Eliminação nos pênaltis" })
  if (fl.includes("upset")) stories.push({ type: "underdog", score: 92 })
  return {
    matchId: m.id, winner, loser, homeTeam: m.home, awayTeam: m.away,
    homeScore: m.homeScore, awayScore: m.awayScore, stage: st, round: m.round,
    score: penStr ? `${score} (pen: ${penStr})` : score,
    penaltyScore: penStr,
    competitionImpact: {
      eliminated: isKO(st) && loser ? loser : null,
      nextOpponent: null,
      qualified: isKO(st) && !!winner,
    },
    narrativeFlags: fl,
    simpleImpact: penStr
      ? { classification: `Decisão nos pênaltis (${penStr})`, consequence: `${m.home} e ${m.away} empataram`, tournamentEffect: `Um eliminado nos pênaltis` }
      : isKO(st) && winner
        ? { classification: `${winner} avançou`, consequence: `${winner} segue`, tournamentEffect: loser ? `${loser} eliminado` : "—" }
        : { classification: `${m.home} ${score} ${m.away}`, consequence: "Partida de grupos", tournamentEffect: "Classificação atualizada" },
    storyCandidates: stories,
  }
}

// ─── TOURNAMENT MEMORY ─────────────────────────────────────

function buildMemory(ms) {
  const teams = [...new Set(ms.flatMap(m => [m.home, m.away]))]
  const journeys = {}
  for (const team of teams) {
    const tm = ms.filter(m => m.status !== "live" && (m.home === team || m.away === team))
      .sort((a, b) => a.date.localeCompare(b.date))
    journeys[team] = tm.map(m => {
      const isH = m.home === team, opp = isH ? m.away : m.home
      const sc = isH ? m.homeScore : m.awayScore, co = isH ? m.awayScore : m.homeScore
      if (m.homePens != null) {
        const won = isH ? m.homePens > m.awayPens : m.awayPens > m.homePens
        if (sc === co) return won ? `Eliminou ${opp} nos pênaltis` : `Eliminado por ${opp} nos pênaltis`
      }
      if (sc > co) return isKO(mapStage(m.round)) ? `Eliminou ${opp}` : `Venceu ${opp}`
      if (sc < co) return isKO(mapStage(m.round)) ? `Eliminado por ${opp}` : `Perdeu para ${opp}`
      return `Empatou com ${opp}`
    })
  }
  const narratives = []
  for (const team of teams) {
    const tm = ms.filter(m => (m.home === team || m.away === team)).sort((a,b) => a.date.localeCompare(b.date))
    const lostEarly = tm.slice(0,2).some(m => {
      const isH = m.home === team; return isH ? (m.homeScore ?? 0) < (m.awayScore ?? 0) : (m.awayScore ?? 0) < (m.homeScore ?? 0)
    })
    const inFinal = tm.some(m => mapStage(m.round) === "Final")
    const champ = tm.some(m => mapStage(m.round) === "Final" && (m.home === team ? (m.homeScore ?? 0) > (m.awayScore ?? 0) || (m.homePens ?? 0) > (m.awayPens ?? 0) : (m.awayScore ?? 0) > (m.homeScore ?? 0) || (m.awayPens ?? 0) > (m.homePens ?? 0)))
    if (lostEarly && inFinal && !champ) narratives.push(`${team} se recuperou após início difícil e chegou à final`)
    if (lostEarly && champ) narratives.push(`${team} perdeu na estreia mas se recuperou para ser campeão`)
  }
  return { teamJourneys: journeys, narratives }
}

// ─── TEMPLATES (mesmo comportamento do lib/templates.ts) ───

function isoDate(m) { return m.date }

const fallbackBulletin = {
  heroHeadline: "Brasil vence e elimina a Espanha",
  heroSummary: "Richarlison decide na prorrogação.",
  heroImportanceScore: 95,
  heroTag: "🏆 Mata-mata",
}

// ─── HEADLINE/TEMPLATE (version 2 — pós correção) ─────────

function headlineV2(e) {
  const { winner, loser, penaltyScore, stage, homeTeam, awayTeam } = e
  if (penaltyScore && winner) return `${winner} elimina ${loser} nos pênaltis (${penaltyScore})`
  if (stage === "Final" && winner) return `${winner} é campeão mundial`
  if (stage === "Fase de grupos" && e.narrativeFlags.includes("upset")) return `${winner} surpreende ${loser} na fase de grupos`
  if (winner && loser) return `${winner} elimina ${loser} e segue no torneio`
  return `${homeTeam} vs ${awayTeam}`
}

function summaryV2(e) {
  const { winner, loser, penaltyScore, homeScore, awayScore, stage } = e
  if (penaltyScore && winner && loser) return `${winner} venceu ${loser} nos pênaltis por ${penaltyScore} após ${homeScore}–${awayScore}.`
  if (stage === "Final" && winner && penaltyScore) return `${winner} é campeão mundial nos pênaltis.`
  if (stage === "Final" && winner) return `${winner} é campeão mundial.`
  if (winner && loser && stage !== "Fase de grupos") return `${winner} eliminou ${loser} e avançou.`
  if (e.narrativeFlags.includes("upset") && winner) return `${winner} venceu ${loser} em resultado surpreendente.`
  return `${homeScore}–${awayScore}.`
}

function whyV2(e) {
  const { winner, loser, penaltyScore, stage } = e
  if (stage === "Final" && winner) return `${winner} é campeão mundial. ${loser} espera quatro anos.`
  if (penaltyScore && winner && loser) return `${loser} eliminado nos pênaltis. Drama define o jogo.`
  if (e.competitionImpact.eliminated && winner) return `${loser} eliminado. ${winner} segue vivo.`
  return `Resultado impacta a classificação.`
}

// ─── OLD TEMPLATES (versão 1 — pré-correção, para comparação) ─

function headlineV1(e) {
  if (e.stage === "Fase de grupos") return e.narrativeFlags.includes("upset") ? `${e.awayTeam} surpreende ${e.homeTeam}` : `${e.homeTeam} e ${e.awayTeam}`
  if (e.winner && e.loser && e.homeScore != null && e.awayScore != null && Math.abs(e.homeScore - e.awayScore) <= 1) return `${e.winner} vence ${e.loser} em jogo apertado`
  if (e.winner && e.loser) return `${e.winner} elimina ${e.loser}`
  return `${e.homeTeam} enfrenta ${e.awayTeam}`
}

function summaryV1(e) {
  if (e.narrativeFlags.includes("upset") && e.winner) return `${e.winner} venceu por ${e.score} em resultado surpreendente.`
  if (e.winner && e.loser && e.stage !== "Fase de grupos") return `${e.winner} venceu ${e.loser} por ${e.score}. ${e.loser} eliminado.`
  if (e.winner && e.loser) return `${e.winner} venceu ${e.loser} por ${e.score}.`
  return `Partida encerrada: ${e.homeTeam} ${e.score} ${e.awayTeam}.`
}

function whyV1(e) {
  if (e.competitionImpact.eliminated && e.winner) return `${e.loser} fora. ${e.winner} segue.`
  if (e.narrativeFlags.includes("upset")) return `Resultado surpreendente.`
  return `Resultado impacta classificação.`
}

// ─── LLM (optional) ─────────────────────────────────────────

async function callLLM(matches, memory) {
  if (!OPENAI_KEY) return null
  const data = matches.slice(0,5).map(e => ({
    placar: `${e.homeTeam} ${e.score} ${e.awayTeam}`, vencedor: e.winner, perdedor: e.loser,
    fase: e.stage, eliminado: e.competitionImpact.eliminated, flags: e.narrativeFlags,
    story_candidates: e.storyCandidates, penalty: e.penaltyScore,
  }))
  let prompt = JSON.stringify(data, null, 2)
  if (memory) {
    const j = Object.entries(memory.teamJourneys).map(([t, s]) => `${t}: ${s.join(" → ")}`).join("\n")
    if (j) prompt += `\n\nJORNADA:\n${j}`
    if (memory.narratives.length) prompt += `\n\nCONTEXTO:\n${memory.narratives.join("\n")}`
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [
        { role: "system", content: "Editor do Copa Pulse. Gere JSON: headline (<=15 palavras), summary (1-2 frases), why_it_matters (consequência). Considere story_candidates e contexto narrativo." },
        { role: "user", content: `Jogos:\n\n${prompt}` },
      ], response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 500 }),
    })
    if (!res.ok) return null
    const j = await res.json(), c = j.choices?.[0]?.message?.content
    return c ? JSON.parse(c) : null
  } catch { return null }
}

// ─── RUN ────────────────────────────────────────────────────

function rating(improved) { return improved ? "✅ Melhorou" : "⚠️ Igual" }

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║   Sprint 1.2 — Validação: Memória Narrativa + Pênaltis         ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")
  console.log()

  const matchObjects = MATCHES.map(m => ({ ...m, status: "finished" }))
  const memory = buildMemory(matchObjects)

  // Process each match
  const enriched = MATCHES.map(m => enrich({ ...m, status: "finished" }))

  for (let i = 0; i < enriched.length; i++) {
    const e = enriched[i]
    const m = MATCHES[i]

    const h1 = headlineV1(e), s1 = summaryV1(e), w1 = whyV1(e)
    const h2 = headlineV2(e), s2 = summaryV2(e), w2 = whyV2(e)

    const improved = (h1 !== h2 || s1 !== s2 || w1 !== w2)

    console.log("─".repeat(72))
    console.log(`  ${m.home} ${m.homeScore}–${m.awayScore} ${m.away}  •  ${m.round}`)
    if (m.homePens != null) console.log(`  ⚡ PÊNALTIS: ${m.homePens}–${m.awayPens}`)
    console.log()

    // Show what the context builder detected
    console.log(`  📊 Contexto:  ${e.narrativeFlags.join(", ")}`)
    if (e.storyCandidates.length) console.log(`  📖 Stories:   ${e.storyCandidates.map(s => `${s.type}(${s.score})`).join(", ")}`)

    // Show team journey from memory
    const journeyParts = memory.teamJourneys[m.home]?.slice(0, -1) || []
    if (journeyParts.length > 0) {
      console.log(`  🏃 ${m.home}: ${journeyParts.join(" → ")}`)
    }

    console.log()
    console.log(`  ── ANTES (Sprint 1.1) ──`)
    console.log(`  Headline:    ${h1}`)
    console.log(`  Summary:     ${s1}`)
    console.log(`  Why Matters: ${w1}`)
    console.log()
    console.log(`  ── DEPOIS (Sprint 1.2) ── ${improved ? "✅" : "⚠️"}`)
    console.log(`  Headline:    ${h2}`)
    console.log(`  Summary:     ${s2}`)
    console.log(`  Why Matters: ${w2}`)
    console.log()
    console.log(`  ${improved ? "✅ Melhorou" : "⚠️ Mesma versão"}`)
    console.log()
  }

  // ─── LLM test (optional) ─────────────────────────────────

  if (OPENAI_KEY) {
    console.log("═".repeat(72))
    console.log("🤖  TESTE LLM COM MEMÓRIA NARRATIVA")
    console.log("═".repeat(72))
    console.log()

    const finalMatch = enriched[11] // Argentina vs France
    const ctx = [finalMatch]
    const llm = await callLLM(ctx, memory)
    if (llm) {
      console.log(`  Argentina 3–3 França (4–2 pen) — Final`)
      console.log()
      console.log(`  LLM Headline:    ${llm.headline}`)
      console.log(`  LLM Summary:     ${llm.summary}`)
      console.log(`  LLM Why Matters: ${llm.why_it_matters}`)
      console.log()
      // Compare with template
      console.log(`  Template Headline:    ${headlineV2(finalMatch)}`)
      console.log(`  Template Summary:     ${summaryV2(finalMatch)}`)
      console.log(`  Template Why Matters: ${whyV2(finalMatch)}`)
      console.log()
      console.log(`  Contexto narrativo alimentado:`)
      console.log(`  Journey: ${memory.teamJourneys["Argentina"]?.join(" → ") || "N/A"}`)
      console.log(`  Narrativas: ${memory.narratives.join("; ") || "N/A"}`)
    }
  } else {
    console.log("═".repeat(72))
    console.log("  ⚠️  LLM não testado — OPENAI_API_KEY não configurada")
    console.log()
    console.log("  Para testar com IA:")
    console.log("  $env:OPENAI_API_KEY='sk-...'; node scripts/test-sprint2.mjs")
    console.log()
  }

  // ─── FINAL ANALYSIS ──────────────────────────────────────

  console.log("═".repeat(72))
  console.log("📈  ANÁLISE COMPARATIVA")
  console.log("═".repeat(72))
  console.log()

  const penaltyGames = MATCHES.filter(m => m.homePens != null)
  console.log(`  🎯 PÊNALTIS (${penaltyGames.length} jogos)`)
  for (const m of penaltyGames) {
    const e = enrich({ ...m, status: "finished" })
    const oldH = headlineV1(e), newH = headlineV2(e)
    console.log(`  ${m.home} ${m.homeScore}–${m.awayScore} ${m.away}`)
    console.log(`    Antes:  "${oldH}"`)
    console.log(`    Depois: "${newH}"`)
    console.log(`    Story:  ${e.storyCandidates.map(s => `${s.type}(${s.score})`).join(", ")}`)
    console.log()
  }

  console.log(`  🧠 MEMÓRIA NARRATIVA`)
  console.log(`  Times com jornada: ${Object.keys(memory.teamJourneys).length}`)
  console.log(`  Narrativas detectadas: ${memory.narratives.length}`)
  for (const n of memory.narratives) {
    console.log(`    → ${n}`)
  }
  console.log()
  console.log(`  Exemplo: Jornada da Argentina:`)
  console.log(`  ${memory.teamJourneys["Argentina"]?.join("\n  → ") || "N/A"}`)
  console.log()
  console.log(`  Exemplo: Jornada do Marrocos:`)
  console.log(`  ${memory.teamJourneys["Marrocos"]?.join("\n  → ") || "N/A"}`)

  console.log()
  console.log("═".repeat(72))
  console.log("✅  Validação concluída")
  console.log("═".repeat(72))
}

main().catch(console.error)
