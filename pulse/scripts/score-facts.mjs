/**
 * Sistema de Avaliação Editorial — Sprint 1.5
 *
 * Para cada fato, executa VERSÃO A (sem fato) vs VERSÃO B (com fato).
 * Mede impacto real na geração de conteúdo.
 *
 * Uso:
 *   $env:DEEPSEEK_API_KEY='sk-...'; node scripts/score-facts.mjs
 */

// ─── 5 FACTS × 1 MATCH CADA (onde o fato DEVE disparar) ──

const TESTS = [
  {
    factId: "years_since_last_title",
    editorialWeight: 95,
    match: { home: "Argentina", away: "França", homeScore: 3, awayScore: 3, homePens: 4, awayPens: 2, round: "Final", date: "2022-12-18" },
    factDesc: "Argentina não vencia a Copa desde 1986 — há 36 anos",
  },
  {
    factId: "first_african_semifinalist",
    editorialWeight: 95,
    match: { home: "Marrocos", away: "Portugal", homeScore: 1, awayScore: 0, round: "Quarter-finals", date: "2022-12-10" },
    factDesc: "Marrocos é a primeira seleção africana a chegar em uma semifinal de Copa do Mundo",
  },
  {
    factId: "defending_champion_eliminated",
    editorialWeight: 85,
    match: { home: "Argentina", away: "França", homeScore: 3, awayScore: 3, homePens: 4, awayPens: 2, round: "Final", date: "2022-12-18" },
    factDesc: "França, atual campeã mundial (2018), foi derrotada na final",
  },
  {
    factId: "streak_broken",
    editorialWeight: 80,
    match: { home: "Argentina", away: "Arábia Saudita", homeScore: 1, awayScore: 2, round: "Group C - Matchday 1", date: "2022-11-22" },
    factDesc: "Argentina teve sua sequência invicta de 36 jogos quebrada pela Arábia Saudita",
  },
  {
    factId: "giant_killing",
    editorialWeight: 85,
    match: { home: "Argentina", away: "Arábia Saudita", homeScore: 1, awayScore: 2, round: "Group C - Matchday 1", date: "2022-11-22" },
    factDesc: "Arábia Saudita (51ª no ranking) venceu Argentina (3ª) — diferença de 48 posições",
  },
]

// ─── PROMPTS ──────────────────────────────────────────────

const SYS = `Você é editor do Copa Pulse. Gere JSON: headline (até 15 palavras, ação), summary (1-2 frases), why_it_matters (consequência). NUNCA repetir placar no why_it_matters. NUNCA inventar informações. JSON: { "headline": string, "summary": string, "why_it_matters": string }`

const SYS_WITH_FACTS = `Você é editor do Copa Pulse. Gere JSON: headline (até 15 palavras, ação), summary (1-2 frases), why_it_matters (consequência). Use os FATOS HISTÓRICOS fornecidos para enriquecer a narrativa. FATOS HISTÓRICOS têm prioridade sobre outros contextos. NUNCA repetir placar no why_it_matters. NUNCA inventar informações. JSON: { "headline": string, "summary": string, "why_it_matters": string }`

function buildPrompt(match, includeFact, factDesc) {
  const score = match.homePens != null
    ? `${match.homeScore}–${match.awayScore} (pen: ${match.homePens}–${match.awayPens})`
    : `${match.homeScore}–${match.awayScore}`
  const data = [{ placar: `${match.home} ${score} ${match.away}`, fase: mapStage(match.round) }]
  let p = JSON.stringify(data, null, 2)
  if (includeFact && factDesc) {
    p += `\n\nFATOS HISTÓRICOS:\n  • ${factDesc}`
  }
  return p
}

function mapStage(r) {
  const s = r.toLowerCase()
  if (s.includes("quarter")) return "Quartas de final"
  if (s.includes("semi")) return "Semifinal"
  if (s.includes("final")) return "Final"
  if (s.includes("group")) return "Fase de grupos"
  return r
}

async function callLLM(prompt, useFacts) {
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: useFacts ? SYS_WITH_FACTS : SYS }, { role: "user", content: `Dados do jogo:\n\n${prompt}` }],
        response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 500,
      }),
    })
    if (!res.ok) return null
    const j = await res.json(), c = j.choices?.[0]?.message?.content
    return c ? JSON.parse(c) : null
  } catch { return null }
}

// ─── SCORING ───────────────────────────────────────────────

function score(a, b, factId) {
  const dimensions = []

  // 1. Headline mudou?
  const headlineChanged = a.headline !== b.headline
  dimensions.push({ dim: "headline_mudou", score: headlineChanged ? 1 : 0, desc: headlineChanged ? `"${a.headline}" → "${b.headline}"` : "idêntica" })

  // 2. Summary mais informativo?
  const summaryLonger = b.summary.length > a.summary.length + 10
  dimensions.push({ dim: "summary_melhor", score: summaryLonger ? 1 : 0, desc: summaryLonger ? `${a.summary.length}→${b.summary.length} chars` : "similar" })

  // 3. Why Matters mais útil? (mais específico = maior = melhor até certo ponto)
  const whyLonger = b.why_it_matters.length > a.why_it_matters.length + 15
  dimensions.push({ dim: "why_melhor", score: whyLonger ? 1 : 0, desc: whyLonger ? `${a.why_it_matters.length}→${b.why_it_matters.length} chars` : "similar" })

  // 4. Fato foi usado?
  const factWords = factId === "years_since_last_title" ? ["1986", "36", "jejum", "espera", "década"]
    : factId === "first_african_semifinalist" ? ["primeira", "africana", "história", "inédito"]
    : factId === "defending_champion_eliminated" ? ["atual", "campeã", "defesa"]
    : factId === "streak_broken" ? ["invic", "sequência", "quebra", "36"]
    : factId === "giant_killing" ? ["ranking", "posição", "zebra", "diferença"]
    : []
  const usedInHeadline = factWords.some(w => b.headline.toLowerCase().includes(w))
  const usedInWhy = factWords.some(w => b.why_it_matters.toLowerCase().includes(w))
  const factUsed = usedInHeadline || usedInWhy
  dimensions.push({ dim: "fato_usado", score: factUsed ? 2 : 0, desc: factUsed ? "evidente no output" : "não detectado" })

  // 5. Narrativa principal mudou?
  const narrativeShift = headlineChanged && factUsed
  dimensions.push({ dim: "narrativa_alterada", score: narrativeShift ? 2 : 0, desc: narrativeShift ? "headline mudou E fato foi usado" : "sem alteração narrativa" })

  const total = dimensions.reduce((s, d) => s + d.score, 0)
  const maxPossible = 7 // 1+1+1+2+2
  const normalized = Math.round((total / maxPossible) * 3)

  let label = "0 = nenhum impacto"
  if (normalized >= 3) label = "3 = impacto alto"
  else if (normalized >= 2) label = "2 = impacto moderado"
  else if (normalized >= 1) label = "1 = impacto baixo"

  return { dimensions, total, normalized, label }
}

// ─── MAIN ──────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗")
  console.log("║  Sistema de Avaliação Editorial — Score de Impacto dos Fatos   ║")
  console.log("╚══════════════════════════════════════════════════════════════════╝")
  console.log()

  if (!process.env.DEEPSEEK_API_KEY) { console.log("❌ Chave não configurada"); process.exit(0) }

  const results = []

  for (const test of TESTS) {
    const m = test.match
    const pA = buildPrompt(m, false, null)
    const pB = buildPrompt(m, true, test.factDesc)

    const a = await callLLM(pA, false)
    const b = await callLLM(pB, true)

    if (!a || !b) {
      console.log(`⚠️  ${test.factId}: erro na chamada LLM, pulando`)
      continue
    }

    const s = score(a, b, test.factId)
    results.push({ ...test, versionA: a, versionB: b, score: s })

    console.log("─".repeat(72))
    console.log(`  📌 ${test.factId}`)
    console.log(`  📊 editorialWeight: ${test.editorialWeight}`)
    console.log(`  🎯 ${m.home} ${m.homeScore}–${m.awayScore} ${m.away}`)
    console.log()
    console.log(`  ── VERSÃO A (sem fato) ──`)
    console.log(`  Headline:    ${a.headline}`)
    console.log(`  Summary:     ${a.summary}`)
    console.log(`  Why Matters: ${a.why_it_matters}`)
    console.log()
    console.log(`  ── VERSÃO B (com fato: "${test.factDesc}") ──`)
    console.log(`  Headline:    ${b.headline}`)
    console.log(`  Summary:     ${b.summary}`)
    console.log(`  Why Matters: ${b.why_it_matters}`)
    console.log()
    console.log(`  ── SCORE ──`)

    const bar = ["⬜", "🟨", "🟧", "🟩"]
    console.log(`  Impacto: ${bar[s.normalized]} ${s.normalized}/3 — ${s.label}`)
    for (const d of s.dimensions) {
      const icon = d.score > 0 ? "✅" : "⬜"
      console.log(`  ${icon} ${d.dim}: ${d.desc}`)
    }
    console.log()
  }

  // ─── RESULTADOS ─────────────────────────────────────────

  console.log("═".repeat(72))
  console.log("📊  RANKING DE IMPACTO DOS FATOS")
  console.log("═".repeat(72))
  console.log()

  results.sort((a, b) => b.score.normalized - a.score.normalized)

  console.log("  Rank | Fato                          | Impacto | editorialWeight | Score")
  console.log("  ─────┼────────────────────────────────┼─────────┼─────────────────┼──────")
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    console.log(`  ${i + 1}.   | ${r.factId.padEnd(30)} | ${r.score.normalized}/3      | ${r.editorialWeight}               | ${r.score.total}/${7}`)
  }

  console.log()
  console.log("  Legenda:")
  console.log("  editorialWeight = peso teórico definido na implementação")
  console.log("  Impacto = peso real medido (0=nada, 3=muda a história)")
  console.log("  Score = soma de 5 dimensões (headline, summary, why, uso, narrativa)")

  const avgImpact = results.reduce((s, r) => s + r.score.normalized, 0) / results.length
  console.log()
  console.log(`  Impacto médio: ${avgImpact.toFixed(1)}/3`)

  // Recommendação
  const keep = results.filter(r => r.score.normalized >= 2)
  const review = results.filter(r => r.score.normalized < 2)
  console.log()
  if (keep.length > 0) {
    console.log(`  ✅ Manter (impacto >= 2): ${keep.map(r => r.factId).join(", ")}`)
  }
  if (review.length > 0) {
    console.log(`  ⚠️  Revisar (impacto < 2): ${review.map(r => r.factId).join(", ")}`)
  }
  console.log()
  console.log("═".repeat(72))
  console.log("✅  Avaliação concluída")
  console.log("═".repeat(72))
}

main().catch(console.error)
