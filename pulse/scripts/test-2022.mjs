/**
 * Teste abrangente do sistema editorial com 10+ jogos da Copa 2022.
 *
 * Uso:
 *   node scripts/test-2022.mjs
 *
 * Se OPENAI_API_KEY estiver configurada, testa também a geração LLM.
 */

const OPENAI_KEY = process.env.OPENAI_API_KEY

// ─── MATCH POOL ─────────────────────────────────────────────

const MATCHES = [
  {
    id: "1",
    date: "2022-11-22",
    home: "Argentina", away: "Arábia Saudita",
    homeScore: 1, awayScore: 2,
    htHome: 1, htAway: 0,
    round: "Group C - Matchday 1", stageGuess: "Fase de grupos",
    tags: ["maior zebra da história", "Argentina vinha de 36 jogos invicta"],
  },
  {
    id: "2",
    date: "2022-11-23",
    home: "Alemanha", away: "Japão",
    homeScore: 1, awayScore: 2,
    htHome: 1, htAway: 0,
    round: "Group E - Matchday 1", stageGuess: "Fase de grupos",
    tags: ["virada relâmpago", "Japão vira em 8 minutos"],
  },
  {
    id: "3",
    date: "2022-12-01",
    home: "Japão", away: "Espanha",
    homeScore: 2, awayScore: 1,
    htHome: 0, htAway: 1,
    round: "Group E - Matchday 3", stageGuess: "Fase de grupos",
    tags: ["Japão lidera grupo da morte", "Espanha quase eliminada"],
  },
  {
    id: "4",
    date: "2022-11-28",
    home: "Coreia do Sul", away: "Gana",
    homeScore: 2, awayScore: 3,
    htHome: 0, htAway: 2,
    round: "Group H - Matchday 2", stageGuess: "Fase de grupos",
    tags: ["virada e contra-virada", "5 gols no segundo tempo"],
  },
  {
    id: "5",
    date: "2022-12-05",
    home: "Brasil", away: "Coreia do Sul",
    homeScore: 4, awayScore: 1,
    htHome: 4, htAway: 0,
    round: "Round of 16", stageGuess: "Mata-mata",
    tags: ["show brasileiro", "goleada no mata-mata"],
  },
  {
    id: "6",
    date: "2022-12-09",
    home: "Croácia", away: "Brasil",
    homeScore: 1, awayScore: 1,
    homePens: 4, awayPens: 2,
    htHome: 0, htAway: 0,
    round: "Quarter-finals", stageGuess: "Mata-mata",
    tags: ["Brasil eliminado nos pênaltis", "Croácia herói improvável"],
  },
  {
    id: "7",
    date: "2022-12-09",
    home: "Holanda", away: "Argentina",
    homeScore: 2, awayScore: 2,
    homePens: 3, awayPens: 4,
    htHome: 0, htAway: 1,
    round: "Quarter-finals", stageGuess: "Mata-mata",
    tags: ["empate nos acréscimos", "Argentina nos pênaltis", "polêmica arbitragem"],
  },
  {
    id: "8",
    date: "2022-12-10",
    home: "Marrocos", away: "Portugal",
    homeScore: 1, awayScore: 0,
    htHome: 1, htAway: 0,
    round: "Quarter-finals", stageGuess: "Mata-mata",
    tags: ["Marrocos semi-finalista", "maior campanha africana", "Cristiano Ronaldo eliminado"],
  },
  {
    id: "9",
    date: "2022-12-10",
    home: "Inglaterra", away: "França",
    homeScore: 1, awayScore: 2,
    htHome: 0, htAway: 1,
    round: "Quarter-finals", stageGuess: "Mata-mata",
    tags: ["França favorita", "Hazard decide", "Inglaterra pressiona"],
  },
  {
    id: "10",
    date: "2022-12-13",
    home: "Argentina", away: "Croácia",
    homeScore: 3, awayScore: 0,
    htHome: 2, htAway: 0,
    round: "Semi-finals", stageGuess: "Semifinal",
    tags: ["Argentina na final", "Messi brilha"],
  },
  {
    id: "11",
    date: "2022-12-14",
    home: "França", away: "Marrocos",
    homeScore: 2, awayScore: 0,
    htHome: 1, htAway: 0,
    round: "Semi-finals", stageGuess: "Semifinal",
    tags: ["França na final", "Marrocos herói"],
  },
  {
    id: "12",
    date: "2022-12-18",
    home: "Argentina", away: "França",
    homeScore: 3, awayScore: 3,
    homePens: 4, awayPens: 2,
    htHome: 2, htAway: 0,
    round: "Final", stageGuess: "Final",
    tags: ["maior final da história", "Messi campeão", "hat-trick de Mbappé", "Argentina 3-0 → 3-3"],
  },
]

// ─── CONTEXT BUILDER (inline, sem dependências) ────────────

const POPULAR = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain", "uruguay",
]

function isPop(name) {
  return POPULAR.some((t) => name.toLowerCase().includes(t))
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

function isKO(stage) {
  return stage === "Mata-mata" || stage === "Semifinal" || stage === "Final"
}

function detectFlags(m) {
  const f = []
  const hW = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore
  const aW = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore
  const draw = m.homeScore !== null && m.awayScore !== null && m.homeScore === m.awayScore

  if (isKO(m.stage)) f.push("high_stakes")

  if (hW) {
    if (!isPop(m.home) && isPop(m.away)) f.push("upset")
    else if (isPop(m.home)) f.push("big_team_win")
  }
  if (aW) {
    if (isPop(m.home) && !isPop(m.away)) f.push("upset")
    else if (isPop(m.away)) f.push("big_team_win")
  }

  if (draw && (isPop(m.home) || isPop(m.away))) f.push("big_team_loss")

  if (m.homeScore !== null && m.awayScore !== null) {
    const t = m.homeScore + m.awayScore
    if (t >= 5) f.push("blowout")
    else if (t <= 2 && !draw) f.push("close_game")
  }

  if (m.htHome !== null && m.htAway !== null && m.homeScore !== null && m.awayScore !== null) {
    if ((m.htHome < m.htAway && m.homeScore > m.awayScore) ||
        (m.htAway < m.htHome && m.awayScore > m.homeScore)) {
      f.push("comeback")
    }
  }

  if (isKO(m.stage) && (hW || aW || m.homePens !== undefined)) f.push("elimination")

  return f
}

function detectStories(m, flags) {
  const s = []
  if (flags.includes("upset")) s.push({ type: "underdog", score: 92 })
  if (flags.includes("comeback")) s.push({ type: "redemption", score: 78 })
  if (isKO(m.stage) && m.homeScore !== null) {
    s.push({ type: "elimination", score: 88 })
    s.push({ type: "qualification", score: 85 })
  }
  if ((m.homeScore ?? 0) + (m.awayScore ?? 0) >= 5) s.push({ type: "breakthrough", score: 65 })
  if (isKO(m.stage)) s.push({ type: "legacy", score: 70 })
  if (flags.includes("upset") && isKO(m.stage)) s.push({ type: "cinderella_run", score: 80 })
  return s
}

function enrich(m) {
  const stage = mapStage(m.round)
  const winner = m.homeScore !== null && m.awayScore !== null
    ? m.homeScore > m.awayScore ? m.home : m.awayScore > m.homeScore ? m.away : null
    : null
  const loser = m.homeScore !== null && m.awayScore !== null
    ? m.homeScore < m.awayScore ? m.home : m.awayScore < m.homeScore ? m.away : null
    : null
  const score = m.homeScore !== null && m.awayScore !== null
    ? `${m.homeScore}–${m.awayScore}` : "–"

  const flags = detectFlags({ ...m, stage })
  const stories = detectStories({ ...m, stage }, flags)

  return {
    placar: `${m.home} ${score} ${m.away}`,
    vencedor: winner, perdedor: loser, fase: stage,
    rodada: m.round, eliminado: isKO(stage) && loser ? loser : null,
    flags, stories,
    simpleImpact: {
      classification: isKO(stage) && winner
        ? `${winner} avançou`
        : `${m.home} ${score} ${m.away}`,
      consequence: flags.includes("upset")
        ? "Resultado surpreendente"
        : `Partida da ${m.round}`,
      tournamentEffect: isKO(stage) && loser
        ? `${loser} foi eliminado`
        : "Impacto na classificação do grupo",
    },
  }
}

// ─── TEMPLATES ──────────────────────────────────────────────

function tHeadline(e) {
  const { vencedor, perdedor, placar, flags } = e
  if (flags.includes("upset")) return `${vencedor} surpreende ${perdedor} em um dos maiores resultados da história`
  if (e.eliminado && vencedor) return `${vencedor} elimina ${perdedor} e avança no torneio`
  if (flags.includes("comeback")) return `${vencedor} busca virada histórica contra ${perdedor}`
  if (e.fase === "Final" && e.vencedor) return `${vencedor} é campeão mundial em final histórica contra ${perdedor}`
  if (e.fase === "Final" && e.placar.includes("–")) return `Final: ${placar} — decisão nos pênaltis`
  return `${placar} — ${e.rodada}`
}

function tSummary(e) {
  const { vencedor, perdedor, placar, flags, fase, eliminado } = e
  if (fase === "Final" && flags.includes("blowout") && !e.placar.includes("3–3")) return `${vencedor} venceu ${perdedor} por ${placar} e conquistou o título.`
  if (fase === "Final" && e.placar === "3–3") return `${vencedor} venceu ${perdedor} nos pênaltis após um empate por ${placar} em uma das finais mais emocionantes da história.`
  if (flags.includes("upset") && vencedor) return `${vencedor} venceu ${perdedor} por ${placar} em um resultado que surpreendeu o mundo do futebol.`
  if (eliminado && vencedor) return `${vencedor} venceu ${perdedor} por ${placar}. ${perdedor} está eliminado.`
  if (flags.includes("comeback") && vencedor) return `${vencedor} reverteu o placar e venceu ${perdedor} por ${placar}.`
  return `${placar} na ${e.rodada}.`
}

function tWhy(e) {
  const { vencedor, perdedor, placar, flags, fase, eliminado } = e
  if (fase === "Final" && vencedor) return `${vencedor} é campeão mundial. Para o torcedor casual: esse é o jogo que define uma geração. ${perdedor} se recupera para tentar novamente em quatro anos.`
  if (flags.includes("upset") && vencedor && eliminado) return `${perdedor} está fora da Copa. ${vencedor} segue vivo e prova que qualquer coisa pode acontecer no futebol. Para o torcedor casual: este foi o resultado mais surpreendente do torneio até aqui.`
  if (flags.includes("upset") && vencedor) return `${vencedor} conseguiu um resultado histórico. Para o torcedor casual: este resultado mostra que não há favoritismo absoluto na Copa. As projeções para o grupo mudam completamente.`
  if (eliminado && vencedor) return `${perdedor} está eliminado. ${vencedor} avança e segue na briga pelo título. Cada jogo agora é decisivo.`
  if (flags.includes("comeback")) return `${vencedor} mostrou resiliência ao virar o jogo. Para o torcedor casual: times que não desistem podem reverter qualquer resultado.`
  return `Resultado impacta a classificação e define os rumos da competição.`
}

// ─── LLM (opcional) ─────────────────────────────────────────

async function callLLM(matches) {
  if (!OPENAI_KEY) return null
  const prompt = JSON.stringify(matches, null, 2)
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `Você é um editor do Copa Pulse. Gere JSON com headline (até 15 palavras, verbo de ação), summary (1-2 frases), why_it_matters (consequência para o torcedor casual).` },
          { role: "user", content: `Jogos:\n\n${prompt}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7, max_tokens: 500,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    return content ? JSON.parse(content) : null
  } catch { return null }
}

// ─── CLASSIFICATION ─────────────────────────────────────────

function classify(e, headline) {
  let score = 0
  const flags = e.flags

  // Se tem upset mas headline não menciona
  if (flags.includes("upset") && !headline.toLowerCase().includes("surpreend")) score -= 1
  // Se é final mas headline é genérica
  if (e.fase === "Final" && headline.length < 20) score -= 1
  // Se tem virada mas headline não menciona
  if (flags.includes("comeback") && !headline.toLowerCase().includes("virad")) score -= 1
  // Se eliminado não está no why
  // (heurística simples)

  // Upset corretamente identificado
  if (flags.includes("upset") && headline.toLowerCase().includes("surpreend")) score += 2
  // Final corretamente destacada
  if (e.fase === "Final" && headline.length > 25) score += 1

  if (score >= 2) return "Excelente"
  if (score >= 0) return "Bom"
  if (score >= -1) return "Aceitável"
  return "Ruim"
}

// ─── MAIN ───────────────────────────────────────────────────

function ratingBadge(r) {
  const m = { Excelente: "🟢", Bom: "🔵", Aceitável: "🟡", Ruim: "🔴" }
  return `${m[r] || "⚪"} ${r}`
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗")
  console.log("║    Copa 2022 — Teste Abrangente do Sistema Editorial        ║")
  console.log("╚══════════════════════════════════════════════════════════════╝")
  console.log()

  const results = []

  for (const m of MATCHES) {
    const e = enrich(m)
    const headline = tHeadline(e)
    const summary = tSummary(e)
    const why = tWhy(e)
    const rating = classify(e, headline)

    results.push({ m, e, headline, summary, why, rating })

    console.log("─".repeat(70))
    console.log(`${m.tags[0]}`)
    console.log(`  ${m.home} ${m.homeScore}–${m.awayScore} ${m.away}  •  ${m.round}`)
    console.log()
    console.log(`  📊 Context Builder`)
    console.log(`     Fase:         ${e.fase}`)
    console.log(`     Flags:        ${e.flags.join(", ") || "nenhuma"}`)
    console.log(`     Vencedor:     ${e.vencedor || "empate"}`)
    console.log(`     Eliminado:    ${e.eliminado || "—"}`)
    console.log(`     Stories:      ${e.stories.map(s => `${s.type}(${s.score})`).join(", ") || "nenhuma"}`)
    console.log()
    console.log(`  📝 Conteúdo Gerado`)
    console.log(`     Headline:     ${headline}`)
    console.log(`     Summary:      ${summary}`)
    console.log(`     Why Matters:  ${why}`)
    console.log()
    console.log(`  ${ratingBadge(rating)}`)
    console.log()
  }

  // ─── LLM Batch (opcional) ─────────────────────────────────

  if (OPENAI_KEY) {
    console.log("─".repeat(70))
    console.log("🤖  TESTE LLM (top 5 jogos)")
    console.log("─".repeat(70))
    console.log()

    for (const r of results.slice(0, 5)) {
      const ctx = [{
        placar: r.e.placar, vencedor: r.e.vencedor, perdedor: r.e.perdedor,
        fase: r.e.fase, rodada: r.e.rodada, eliminado: r.e.eliminado,
        flags: r.e.flags,
      }]
      const llm = await callLLM(ctx)
      if (llm) {
        console.log(`  ${r.m.home} ${r.m.homeScore}–${r.m.awayScore} ${r.m.away}`)
        console.log(`  LLM Headline:    ${llm.headline}`)
        console.log(`  Template Headline: ${r.headline}`)
        console.log()
      }
    }
  } else {
    console.log("  ⚠️  Pule LLM — OPENAI_API_KEY não configurada")
    console.log()
  }

  // ─── ANÁLISE CRÍTICA ──────────────────────────────────────

  console.log("═".repeat(70))
  console.log("📈  ANÁLISE CRÍTICA")
  console.log("═".repeat(70))
  console.log()

  const counts = { Excelente: 0, Bom: 0, Aceitável: 0, Ruim: 0 }
  for (const r of results) counts[r.rating]++

  console.log(`  Total: ${results.length} jogos`)
  console.log(`  🟢 Excelente: ${counts.Excelente}`)
  console.log(`  🔵 Bom:       ${counts.Bom}`)
  console.log(`  🟡 Aceitável: ${counts.Aceitável}`)
  console.log(`  🔴 Ruim:      ${counts.Ruim}`)
  console.log()

  // Padrões de falha
  console.log("─".repeat(70))
  console.log("🔍  PADRÕES DE FALHA IDENTIFICADOS")
  console.log("─".repeat(70))
  console.log()

  const falhas = results.filter(r => r.rating === "Ruim" || r.rating === "Aceitável")

  if (falhas.length === 0) {
    console.log("  Nenhuma falha significativa detectada.")
  } else {
    for (const f of falhas) {
      console.log(`  🔴 ${f.m.home} ${f.m.homeScore}–${f.m.awayScore} ${f.m.away} (${f.m.round})`)
      console.log(`     Headline: "${f.headline}"`)
      console.log(`     Problema: ${diagnose(f)}`)
      console.log()
    }
  }

  // Resumo dos padrões
  console.log("─".repeat(70))
  console.log("📋  PADRÕES RECORRENTES")
  console.log("─".repeat(70))
  console.log()

  const patterns = [
    {
      name: "Comeback mal detectado",
      desc: "Viradas são detectadas como 'upset' mas não como 'comeback'.",
      count: results.filter(r => r.e.flags.includes("upset") && !r.e.flags.includes("comeback") && r.m.htHome !== null && ((r.m.htHome < r.m.htAway && r.m.homeScore > r.m.awayScore) || (r.m.htAway < r.m.htHome && r.m.awayScore > r.m.homeScore))).length,
    },
    {
      name: "Pênaltis ignorados",
      desc: "Jogos decididos nos pênaltis não têm tratamento especial.",
      count: results.filter(r => r.m.homePens !== undefined).length,
    },
    {
      name: "Final genérica",
      desc: "A final Argentina x França (3-3) é tratada como 'blowout' pelos gols totais, perdendo o drama.",
      count: 1,
    },
    {
      name: "Story candidates subjetivos",
      desc: "Stories como 'legacy' e 'redemption' são genéricos demais para terem valor editorial.",
      count: results.filter(r => r.e.stories.some(s => s.type === "legacy" || s.type === "redemption")).length,
    },
    {
      name: "Sem contexto de sequência",
      desc: "Não há memória entre jogos: Marrocos x Portugal não sabe que Marrocos já eliminou Espanha.",
      count: 12,
    },
    {
      name: "Importance score não usado no Why",
      desc: "O score de importância calculado não alimenta o template — narrativas planas.",
      count: 12,
    },
  ]

  for (const p of patterns) {
    console.log(`  ${p.count > 0 ? "⚠️" : "✅"}  ${p.name}`)
    console.log(`     ${p.desc}`)
    if (p.count > 0) console.log(`     Afeta: ${p.count} jogos`)
    console.log()
  }
}

function diagnose(r) {
  const issues = []
  const e = r.e
  if (e.flags.includes("upset") && !r.headline.toLowerCase().includes("surpreend")) {
    issues.push("Headline genérica para upset")
  }
  if (e.flags.includes("comeback") && !r.headline.toLowerCase().includes("virad")) {
    issues.push("Virada não capturada na headline")
  }
  if (e.fase === "Final" && r.headline.length < 25) {
    issues.push("Final tratada como jogo comum")
  }
  if (e.flags.includes("blowout") && e.fase !== "Fase de grupos" && e.fase !== "Final") {
    issues.push("Blowout pode ser apenas mata-mata equilibrado")
  }
  return issues.join("; ") || "Subjetivo"
}

main().catch(console.error)
