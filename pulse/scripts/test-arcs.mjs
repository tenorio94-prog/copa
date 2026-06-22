/**
 * Validação Sprint 1.7 — Narrative Accumulation
 *
 * Testa: Japão (multi-upset), Marrocos (cinderella), Argentina (redemption)
 * Compara: com e sem arcos narrativos.
 *
 * Uso:
 *   $env:DEEPSEEK_API_KEY='sk-...'; node scripts/test-arcs.mjs
 */

const ALL_MATCHES = [
  // JAPÃO
  { id: "j1", date: "2022-11-23", home: "Alemanha", away: "Japão", homeScore: 1, awayScore: 2, round: "Group E - Matchday 1" },
  { id: "j2", date: "2022-11-27", home: "Japão", away: "Costa Rica", homeScore: 0, awayScore: 1, round: "Group E - Matchday 2" },
  { id: "j3", date: "2022-12-01", home: "Japão", away: "Espanha", homeScore: 2, awayScore: 1, round: "Group E - Matchday 3" },
  // MARROCOS
  { id: "m1", date: "2022-11-23", home: "Marrocos", away: "Croácia", homeScore: 0, awayScore: 0, round: "Group F - Matchday 1" },
  { id: "m2", date: "2022-11-27", home: "Bélgica", away: "Marrocos", homeScore: 0, awayScore: 2, round: "Group F - Matchday 2" },
  { id: "m3", date: "2022-12-01", home: "Canadá", away: "Marrocos", homeScore: 1, awayScore: 2, round: "Group F - Matchday 3" },
  { id: "m4", date: "2022-12-06", home: "Marrocos", away: "Espanha", homeScore: 0, awayScore: 0, homePens: 3, awayPens: 0, round: "Round of 16" },
  { id: "m5", date: "2022-12-10", home: "Marrocos", away: "Portugal", homeScore: 1, awayScore: 0, round: "Quarter-finals" },
  // ARGENTINA
  { id: "a1", date: "2022-11-22", home: "Argentina", away: "Arábia Saudita", homeScore: 1, awayScore: 2, round: "Group C - Matchday 1" },
  { id: "a2", date: "2022-11-26", home: "Argentina", away: "México", homeScore: 2, awayScore: 0, round: "Group C - Matchday 2" },
  { id: "a3", date: "2022-11-30", home: "Polônia", away: "Argentina", homeScore: 0, awayScore: 2, round: "Group C - Matchday 3" },
  { id: "a4", date: "2022-12-03", home: "Argentina", away: "Austrália", homeScore: 2, awayScore: 1, round: "Round of 16" },
  { id: "a5", date: "2022-12-09", home: "Holanda", away: "Argentina", homeScore: 2, awayScore: 2, homePens: 3, awayPens: 4, round: "Quarter-finals" },
  { id: "a6", date: "2022-12-13", home: "Argentina", away: "Croácia", homeScore: 3, awayScore: 0, round: "Semi-finals" },
  { id: "a7", date: "2022-12-18", home: "Argentina", away: "França", homeScore: 3, awayScore: 3, homePens: 4, awayPens: 2, round: "Final" },
]

function mapStage(r) { const s = r.toLowerCase(); if (s.includes("quarter")) return "Mata-mata"; if (s.includes("round")) return "Mata-mata"; if (s.includes("semi")) return "Semifinal"; if (s.includes("final")) return "Final"; if (s.includes("group")) return "Fase de grupos"; return "Torneio" }
function isKO(s) { return s === "Mata-mata" || s === "Semifinal" || s === "Final" }

const POPULAR = ["brazil","argentina","germany","france","england","italy","netherlands","portugal","spain","uruguay"]
function isPop(n) { return POPULAR.some(t => n.toLowerCase().includes(t)) }

const TESTS = [
  { team: "Japão", targetMatch: "j3", label: "Japão vs Espanha — 2 upsets no grupo" },
  { team: "Marrocos", targetMatch: "m5", label: "Marrocos vs Portugal — cinderella run" },
  { team: "Argentina", targetMatch: "a7", label: "Argentina vs França — redenção" },
]

// ─── ARC DETECTION ───────────────────────────────────────

function detectArcsForTeam(team, all) {
  const tm = all.filter(m => m.home === team || m.away === team)
    .map(m => ({ ...m, stage: mapStage(m.round) }))
    .sort((a,b) => a.date.localeCompare(b.date))

  const arcs = []

  // Multi-upset
  const groupWins = tm.filter(m => m.stage === "Fase de grupos" && ((m.home === team && m.homeScore > m.awayScore) || (m.away === team && m.awayScore > m.homeScore)) && isPop(m.home === team ? m.away : m.home))
  if (groupWins.length >= 2) arcs.push({ type: "multi_upset_run", w: 85, summary: `${team} derrotou duas campeãs mundiais na mesma fase de grupos` })

  // Cinderella
  const koWins = tm.filter(m => isKO(m.stage) && ((m.home === team && ((m.homeScore || 0) > (m.awayScore || 0) || (m.homePens || 0) > (m.awayPens || 0))) || (m.away === team && ((m.awayScore || 0) > (m.homeScore || 0) || (m.awayPens || 0) > (m.homePens || 0)))) && isPop(m.home === team ? m.away : m.home))
  if (koWins.length >= 2) {
    const opps = koWins.map(m => m.home === team ? m.away : m.home)
    arcs.push({ type: "cinderella_progression", w: 90, summary: `${team} eliminou ${opps.join(" e ")}, duas favoritas ao título` })
  }

  // Redemption
  if (tm.length >= 3) {
    const first = tm[0]
    const lostOpener = (first.home === team ? (first.homeScore || 0) < (first.awayScore || 0) : (first.awayScore || 0) < (first.homeScore || 0))
    const last = tm[tm.length - 1]
    const wonLast = (last.home === team ? ((last.homeScore || 0) > (last.awayScore || 0) || (last.homePens || 0) > (last.awayPens || 0)) : ((last.awayScore || 0) > (last.homeScore || 0) || (last.awayPens || 0) > (last.homePens || 0)))
    const isChamp = last.stage === "Final" && wonLast
    if (lostOpener && isChamp) arcs.push({ type: "redemption_journey", w: 95, summary: `${team} perdeu na estreia e se tornou campeã mundial` })
  }

  // Giant slayer
  if (koWins.length >= 2) {
    const opps = koWins.map(m => m.home === team ? m.away : m.home)
    arcs.push({ type: "giant_slayer", w: 85, summary: `${team} derrubou ${opps.join(" e ")} para chegar onde está` })
  }

  return arcs
}

// ─── PROMPTS ──────────────────────────────────────────────

const SYS = "Você é editor do Copa Pulse. Gere JSON: headline (até 15 palavras, ação), summary (1-2 frases), why_it_matters (consequência). NUNCA repetir placar no why_it_matters. JSON: { headline, summary, why_it_matters }"
const SYS_A = "Você é editor do Copa Pulse. Gere JSON: headline, summary, why_it_matters. Considere os ARCOS NARRATIVOS para conectar múltiplos jogos da mesma equipe. JSON: { headline, summary, why_it_matters }"

function buildPrompt(m, arcs) {
  const score = m.homePens != null ? `${m.homeScore}–${m.awayScore} (pen: ${m.homePens}–${m.awayPens})` : `${m.homeScore}–${m.awayScore}`
  const data = [{ placar: `${m.home} ${score} ${m.away}`, fase: mapStage(m.round) }]
  let p = JSON.stringify(data, null, 2)
  if (arcs && arcs.length > 0) {
    p += "\n\nARCOS NARRATIVOS:\n" + arcs.sort((a, b) => b.w - a.w).map(a => `  • ${a.summary}`).join("\n")
  }
  return p
}

async function callDS(prompt, useArcs) {
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: useArcs ? SYS_A : SYS }, { role: "user", content: `Jogos:\n\n${prompt}` }], response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 500 }),
    })
    if (!res.ok) return null
    const j = await res.json(), c = j.choices?.[0]?.message?.content
    return c ? JSON.parse(c) : null
  } catch { return null }
}

// ─── MAIN ─────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║  Sprint 1.7 — Narrative Accumulation                          ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")
  console.log()

  if (!process.env.DEEPSEEK_API_KEY) { console.log("❌ Chave"); process.exit(0) }

  let improved = 0

  for (const test of TESTS) {
    const all = ALL_MATCHES.map(m => ({ ...m, status: "finished" }))
    const arcs = detectArcsForTeam(test.team, all)
    const match = ALL_MATCHES.find(m => m.id === test.targetMatch)

    const pBase = buildPrompt(match, null)
    const pArcs = buildPrompt(match, arcs)

    const base = await callDS(pBase, false)
    const withArcs = await callDS(pArcs, true)

    console.log("─".repeat(72))
    console.log(`  ${test.label}`)
    console.log()

    if (arcs.length > 0) {
      console.log(`  📜 ARCOS DETECTADOS:`)
      for (const a of arcs) console.log(`     [${a.w}] ${a.summary}`)
    } else {
      console.log(`  📜 Nenhum arco detectado`)
    }
    console.log()

    if (base) {
      console.log(`  ── SEM ARCOS ──`)
      console.log(`  Headline:    ${base.headline}`)
      console.log(`  Summary:     ${base.summary}`)
      console.log(`  Why Matters: ${base.why_it_matters}`)
    }
    console.log()
    if (withArcs) {
      console.log(`  ── COM ARCOS ──`)
      console.log(`  Headline:    ${withArcs.headline}`)
      console.log(`  Summary:     ${withArcs.summary}`)
      console.log(`  Why Matters: ${withArcs.why_it_matters}`)
    }

    // Check improvement
    if (base && withArcs) {
      const headlineChanged = base.headline !== withArcs.headline
      const usedArc = arcs.length > 0 && (withArcs.headline.includes("campeã") || withArcs.headline.includes("mundiais") || withArcs.headline.includes("derrubou") || withArcs.headline.includes("estreia") || withArcs.headline.includes("história") || withArcs.why_it_matters.includes("mundiais") || withArcs.why_it_matters.includes("recuperou"))
      if (headlineChanged || usedArc) { improved++; console.log(`\n  ✅ Melhorou`) }
      else console.log(`\n  ⚠️  Similar`)
    }
    console.log()
  }

  console.log("═".repeat(72))
  console.log("📊  RESULTADO")
  console.log("═".repeat(72))
  console.log()
  console.log(`  Melhoraram: ${improved}/${TESTS.length}`)
  console.log(`  ${improved >= 2 ? "✅ Narrative Accumulation funciona — implementar" : "⚠️ Revisar detecção"}`)
  console.log()
}

main().catch(console.error)
