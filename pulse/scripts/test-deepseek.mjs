/**
 * Validação DeepSeek vs Templates — Sprint 1.2
 *
 * Testa o pipeline: Context Builder → Tournament Memory → DeepSeek
 * Compara com templates para 5 jogos marcantes da Copa 2022.
 *
 * Uso:
 *   node scripts/test-deepseek.mjs
 */

// ─── 5 MATCHES ──────────────────────────────────────────────

const MATCHES = [
  { id: "1", date: "2022-11-22", home: "Argentina", away: "Arábia Saudita",
    homeScore: 1, awayScore: 2, htHome: 1, htAway: 0,
    round: "Group C - Matchday 1" },
  { id: "2", date: "2022-11-23", home: "Alemanha", away: "Japão",
    homeScore: 1, awayScore: 2, htHome: 1, htAway: 0,
    round: "Group E - Matchday 1" },
  { id: "6", date: "2022-12-09", home: "Croácia", away: "Brasil",
    homeScore: 1, awayScore: 1, homePens: 4, awayPens: 2, htHome: 0, htAway: 0,
    round: "Quarter-finals" },
  { id: "8", date: "2022-12-10", home: "Marrocos", away: "Portugal",
    homeScore: 1, awayScore: 0, htHome: 1, htAway: 0,
    round: "Quarter-finals" },
  { id: "12", date: "2022-12-18", home: "Argentina", away: "França",
    homeScore: 3, awayScore: 3, homePens: 4, awayPens: 2, htHome: 2, htAway: 0,
    round: "Final" },
]

// ─── CONTEXT BUILDER (inline) ──────────────────────────────

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
    if (m.homeScore + m.awayScore >= 5) f.push("blowout"); else if (m.homeScore + m.awayScore <= 2 && !d) f.push("close_game")
  }
  if (isKO(st) && (hW || aW || m.homePens != null)) f.push("elimination")
  return f
}

function enrich(m) {
  const st = mapStage(m.round), fl = detectFlags(m, st)
  let winner = null, loser = null
  if (m.homePens != null) { winner = m.homePens > m.awayPens ? m.home : m.away; loser = m.homePens > m.awayPens ? m.away : m.home }
  else if (m.homeScore != null && m.awayScore != null) { winner = m.homeScore > m.awayScore ? m.home : m.awayScore > m.homeScore ? m.away : null; loser = m.homeScore < m.awayScore ? m.home : m.awayScore < m.homeScore ? m.away : null }
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
    competitionImpact: { eliminated: isKO(st) && loser ? loser : null, nextOpponent: null, qualified: isKO(st) && !!winner },
    narrativeFlags: fl,
    simpleImpact: penStr ? { classification: `Decisão nos pênaltis (${penStr})`, consequence: `${m.home} vs ${m.away}`, tournamentEffect: `Um eliminado` } : isKO(st) && winner ? { classification: `${winner} avançou`, consequence: `${winner} segue`, tournamentEffect: loser ? `${loser} eliminado` : "—" } : { classification: `${m.home} ${score} ${m.away}`, consequence: "Partida de grupos", tournamentEffect: "Classificação atualizada" },
    storyCandidates: stories,
  }
}

// ─── TOURNAMENT MEMORY ─────────────────────────────────────

function buildMemory(ms) {
  const teams = [...new Set(ms.flatMap(m => [m.home, m.away]))]
  const journeys = {}
  for (const team of teams) {
    const tm = ms.filter(m => m.home === team || m.away === team).sort((a,b) => a.date.localeCompare(b.date))
    journeys[team] = tm.map(m => {
      const isH = m.home === team, opp = isH ? m.away : m.home, sc = isH ? m.homeScore : m.awayScore, co = isH ? m.awayScore : m.homeScore
      if (m.homePens != null && sc === co) {
        const won = isH ? m.homePens > m.awayPens : m.awayPens > m.homePens
        return won ? `Eliminou ${opp} nos pênaltis` : `Eliminado por ${opp} nos pênaltis`
      }
      if (sc > co) return isKO(mapStage(m.round)) ? `Eliminou ${opp}` : `Venceu ${opp}`
      if (sc < co) return isKO(mapStage(m.round)) ? `Eliminado por ${opp}` : `Perdeu para ${opp}`
      return `Empatou com ${opp}`
    })
  }
  const narratives = []
  for (const team of teams) {
    const tm = ms.filter(m => m.home === team || m.away === team).sort((a,b) => a.date.localeCompare(b.date))
    const lostEarly = tm.slice(0,2).some(m => { const isH = m.home === team; return isH ? (m.homeScore ?? 0) < (m.awayScore ?? 0) : (m.awayScore ?? 0) < (m.homeScore ?? 0) })
    const champ = tm.some(m => mapStage(m.round) === "Final" && ((m.home === team && ((m.homeScore ?? 0) > (m.awayScore ?? 0) || (m.homePens ?? 0) > (m.awayPens ?? 0))) || (m.away === team && ((m.awayScore ?? 0) > (m.homeScore ?? 0) || (m.awayPens ?? 0) > (m.homePens ?? 0)))))
    if (lostEarly && champ) narratives.push(`${team} perdeu na estreia mas se recuperou para ser campeão`)
  }
  return { teamJourneys: journeys, narratives }
}

// ─── TEMPLATES (v2) ────────────────────────────────────────

function tHeadline(e) {
  const { winner, loser, penaltyScore, stage } = e
  if (stage === "Final" && winner && penaltyScore) return `${winner} é campeão mundial nos pênaltis`
  if (stage === "Final" && winner) return `${winner} é campeão mundial`
  if (penaltyScore && winner) return `${winner} elimina ${loser} nos pênaltis`
  if (e.narrativeFlags.includes("upset")) return `${winner} surpreende ${loser}`
  if (winner && loser) return `${winner} elimina ${loser} e segue no torneio`
  return `${e.homeTeam} vs ${e.awayTeam}`
}

function tSummary(e) {
  const { winner, loser, penaltyScore, homeScore, awayScore } = e
  if (penaltyScore && winner && loser) return `${winner} venceu ${loser} nos pênaltis por ${penaltyScore} após ${homeScore}–${awayScore}.`
  if (e.stage === "Final" && winner && penaltyScore) return `${winner} é campeão mundial nos pênaltis.`
  if (winner && loser && e.stage !== "Fase de grupos") return `${winner} eliminou ${loser} e avançou.`
  if (e.narrativeFlags.includes("upset") && winner) return `${winner} venceu ${loser} em resultado surpreendente.`
  return `${homeScore}–${awayScore}.`
}

function tWhy(e) {
  const { winner, loser, penaltyScore, stage } = e
  if (stage === "Final" && winner) return `${winner} é campeão mundial. ${loser} espera quatro anos.`
  if (penaltyScore && winner && loser) return `${loser} eliminado nos pênaltis. Drama define o jogo.`
  if (e.competitionImpact.eliminated && winner) return `${loser} eliminado. ${winner} segue vivo.`
  return `Resultado impacta classificação.`
}

// ─── DEEPSEEK CALL ─────────────────────────────────────────

const SYSTEM_PROMPT = `Você é o editor do Copa Pulse. Gere JSON com headline (até 15 palavras, verbo de ação), summary (1-2 frases), why_it_matters (consequência para o torcedor casual).

Considere story_candidates e contexto narrativo ao decidir o que destacar.

NUNCA repetir o placar no why_it_matters. NUNCA usar frases genéricas. NUNCA inventar informações.

Responda APENAS em JSON: { "headline": string, "summary": string, "why_it_matters": string }`

function buildPrompt(e, memory) {
  const data = [{
    placar: `${e.homeTeam} ${e.score} ${e.awayTeam}`, vencedor: e.winner, perdedor: e.loser,
    fase: e.stage, rodada: e.round, eliminado: e.competitionImpact.eliminated,
    flags: e.narrativeFlags, story_candidates: e.storyCandidates,
    penalty: e.penaltyScore,
  }]
  let p = JSON.stringify(data, null, 2)
  if (memory) {
    const steps = Object.entries(memory.teamJourneys).map(([t, s]) => `${t}: ${s.join(" → ")}`).join("\n")
    if (steps) p += `\n\nJORNADA:\n${steps}`
    if (memory.narratives.length) p += `\n\nCONTEXTO:\n${memory.narratives.join("\n")}`
  }
  return p
}

async function callDeepSeek(prompt) {
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Jogos:\n\n${prompt}\n\nResponda APENAS com o JSON.` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7, max_tokens: 500,
      }),
    })
    if (!res.ok) { console.error(`  API error: ${res.status}`); return null }
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    return content ? JSON.parse(content) : null
  } catch (e) { console.error(`  Fetch error: ${e.message}`); return null }
}

// ─── CLASSIFICATION ─────────────────────────────────────────

function classify(d, t) {
  if (!d) return { verdict: "❌ Falhou", reason: "DeepSeek não retornou" }
  let score = 0
  // Headline quality
  if (d.headline && d.headline.length > 10 && d.headline.length < 100) score++
  if (d.headline && (d.headline.includes("elimina") || d.headline.includes("vence") || d.headline.includes("campeão") || d.headline.includes("surpreende"))) score++
  if (d.headline && d.headline.length > t.headline.length) score++ // more specific
  // Summary quality
  if (d.summary && d.summary.length > 10) score++
  if (d.summary && !d.summary.includes("undefined")) score++
  // Why it matters
  if (d.why_it_matters && d.why_it_matters.length > 20) score++
  if (d.why_it_matters && !d.why_it_matters.includes("classificação")) score++ // not generic
  // Memory usage
  if (d.why_it_matters && (d.why_it_matters.includes("recuperou") || d.why_it_matters.includes("estreia") || d.why_it_matters.includes("história"))) score += 2
  // Penalty handling
  if (d.headline && d.headline.includes("pênalti")) score++

  if (score >= 7) return { verdict: "🟢 Muito melhor", reason: `${score}/9` }
  if (score >= 5) return { verdict: "🔵 Melhor", reason: `${score}/9` }
  if (score >= 3) return { verdict: "🟡 Igual", reason: `${score}/9` }
  return { verdict: "🔴 Pior", reason: `${score}/9` }
}

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║  DeepSeek vs Templates — Validação Editorial                    ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")
  console.log()

  if (!process.env.DEEPSEEK_API_KEY) {
    console.log("❌ DEEPSEEK_API_KEY não configurada")
    process.exit(0)
  }

  const results = []

  for (const m of MATCHES) {
    const matchObj = { ...m, status: "finished" }
    const allMatches = MATCHES.map(x => ({ ...x, status: "finished" }))
    const memory = buildMemory(allMatches)
    const e = enrich(matchObj)
    const prompt = buildPrompt(e, memory)

    const template = { headline: tHeadline(e), summary: tSummary(e), why: tWhy(e) }
    const deepseek = await callDeepSeek(prompt)

    if (deepseek) {
      deepseek.why_it_matters_clean = deepseek.why_it_matters
    }
    const rating = classify(deepseek, template)

    results.push({ m, e, memory, template, deepseek, rating })

    console.log("─".repeat(72))
    console.log(`  ${m.home} ${m.homeScore}–${m.awayScore} ${m.away}  •  ${m.round}`)
    if (m.homePens != null) console.log(`  ⚡ PÊNALTIS: ${m.homePens}–${m.awayPens}`)
    console.log()
    console.log(`  📊 Context Builder:`)
    console.log(`     ${e.narrativeFlags.join(", ") || "nenhuma flag"}`)
    console.log(`     Stories: ${e.storyCandidates.map(s => `${s.type}(${s.score})`).join(", ") || "—"}`)
    console.log(`     Eliminado: ${e.competitionImpact.eliminated || "—"}`)
    console.log()

    if (memory) {
      const journey = memory.teamJourneys[m.home]
      if (journey && journey.length > 0) {
        console.log(`  🏃 Jornada de ${m.home}: ${journey.join(" → ")}`)
      }
      if (memory.narratives.length > 0) {
        console.log(`  📖 Narrativa: ${memory.narratives[0]}`)
      }
    }
    console.log()

    console.log(`  ── TEMPLATE ──`)
    console.log(`  Headline:    ${template.headline}`)
    console.log(`  Summary:     ${template.summary}`)
    console.log(`  Why Matters: ${template.why}`)
    console.log()

    if (deepseek) {
      console.log(`  ── DEEPSEEK ──`)
      console.log(`  Headline:    ${deepseek.headline || "(vazio)"}`)
      console.log(`  Summary:     ${deepseek.summary || "(vazio)"}`)
      console.log(`  Why Matters: ${deepseek.why_it_matters || "(vazio)"}`)
      console.log()
      console.log(`  ${rating.verdict}  (${rating.reason})`)
    } else {
      console.log(`  ── DEEPSEEK ──`)
      console.log(`  ❌ Falha na chamada`)
    }
    console.log()
  }

  // ─── RESULTADOS ──────────────────────────────────────────

  console.log("═".repeat(72))
  console.log("📊  RESUMO")
  console.log("═".repeat(72))
  console.log()

  const counts = { "🟢 Muito melhor": 0, "🔵 Melhor": 0, "🟡 Igual": 0, "🔴 Pior": 0, "❌ Falhou": 0 }
  for (const r of results) {
    counts[r.rating.verdict]++
    console.log(`  ${r.rating.verdict}  ${r.m.home} ${r.m.homeScore}–${r.m.awayScore} ${r.m.away}`)
  }
  console.log()

  const passed = results.filter(r => r.deepseek !== null).length
  console.log(`  ✅ Chamadas DeepSeek: ${passed}/${results.length}`)
  console.log(`  🏆 Melhor resultado: ${results.find(r => r.rating.verdict === "🟢 Muito melhor")?.m.home || "—"}`)

  if (results.every(r => r.deepseek !== null)) {
    console.log()
    console.log("  ✅ DeepSeek respondeu em todas as chamadas. Pipeline funcional.")
  }

  console.log()
  console.log("═".repeat(72))
  console.log("✅  Validação concluída")
  console.log("═".repeat(72))
}

main().catch(console.error)
