import type {
  EnrichedMatch,
  TournamentMemory,
  HistoricalFact,
  NarrativeArc,
  EditorialStory,
  EditorialStoryType,
  Match,
} from "./types"
import { getTeamInfo, isTraditional } from "./knowledge"

const POPULAR = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain",
]

function isPopular(name: string): boolean {
  return POPULAR.some((t) => name.toLowerCase().includes(t))
}

const WEAK_NATIONS = [
  "haiti", "curacao", "qatar", "cape verde islands",
  "uzbekistan", "panama", "jordan", "congo dr",
  "new zealand", "bosnia-herzegovina",
]

function isWeak(name: string): boolean {
  return WEAK_NATIONS.some((w) => name.toLowerCase().includes(w))
}

function classifyStoryType(
  match: EnrichedMatch,
  arcs: NarrativeArc[],
  facts: HistoricalFact[]
): EditorialStoryType {
  const events = facts.filter((f) =>
      ["traditional_power_eliminated", "defending_champion_eliminated", "title_favorite_eliminated_early"].includes(f.id)
    )
    if (events.length > 0) return "dynasty_fall"

    const arcTypes = arcs.map((a) => a.type)
    if (arcTypes.includes("redemption_journey")) return "redemption"
    if (arcTypes.includes("cinderella_progression")) return "cinderella"
    if (arcTypes.includes("giant_slayer")) return "cinderella"
    if (arcTypes.includes("multi_upset_run")) return "upset"

    if (facts.some((f) => f.id === "first_african_semifinalist" || f.id === "years_since_last_title")) return "milestone"
    if (facts.some((f) => f.id === "giant_killing" || f.id === "streak_broken")) return "upset"
    if (facts.some((f) => f.id === "first_title_ever" || f.id === "title_drought_ended")) return "milestone"
    if (facts.some((f) => f.id === "best_result_surpassed")) return "milestone"
    if (facts.some((f) => f.id === "repeat_final" || f.id === "back_to_back_final")) return "historical"

    if (match.stage === "Final") return "historical"
    if (match.competitionImpact.eliminated && isPopular(match.loser || "")) return "elimination"
    if (match.narrativeFlags.includes("penalty_drama")) return "elimination"

    // ─── Group stage editorial cascade ─────────────────────
    if (match.stage !== "Fase de grupos") return "historical"

    const isDraw = match.homeScore === match.awayScore && match.homeScore !== null
  const winner = match.winner
  const loser = match.loser
  const isWinnerPopular = winner ? isPopular(winner) : false
  const isWinnerTraditional = winner ? isTraditional(winner) : false
  const isLoserPopular = loser ? isPopular(loser) : false
  const isLoserTraditional = loser ? isTraditional(loser) : false
  const homeIsPopularOrTrad = isPopular(match.homeTeam) || isTraditional(match.homeTeam)
  const awayIsPopularOrTrad = isPopular(match.awayTeam) || isTraditional(match.awayTeam)
  const hasTraditionalWinner = isWinnerPopular || isWinnerTraditional

  // 1. Upset: non-popular/non-traditional beats popular/traditional
  if (!isDraw && winner && !isWinnerPopular && !isWinnerTraditional && (isLoserPopular || isLoserTraditional)) {
    return "upset"
  }

  // 2. Recovery: lost previous match, now won (uses teamForm.lost_opener)
  if (!isDraw && winner && match.teamForm.lost_opener && hasTraditionalWinner) {
    return "redemption"
  }

  // 3. Favorite stumbles: popular or traditional team didn't win (draw or loss)
  if ((homeIsPopularOrTrad || awayIsPopularOrTrad) && (!winner || isDraw)) {
    return "favorite_stumbles"
  }

  // 4. Statement win: large win by popular/traditional team
  if (!isDraw && winner && hasTraditionalWinner) {
    const homeScore = match.homeScore ?? 0
    const awayScore = match.awayScore ?? 0
    const goalDiff = Math.abs(homeScore - awayScore)
    const opponentIsWeak = loser ? isWeak(loser) : false

    if (goalDiff >= 5) return "statement_win"
    if (goalDiff >= 4 && !opponentIsWeak) return "statement_win"
    if (goalDiff === 3 && isWinnerPopular && !opponentIsWeak) return "statement_win"
    if (goalDiff >= 3 && isWinnerTraditional && !opponentIsWeak) return "statement_win"
  }

  return "historical"
}

function calcConfidence(
  match: EnrichedMatch,
  arcs: NarrativeArc[],
  facts: HistoricalFact[],
  isLive?: boolean
): number {
  let c = 0.1

  const eventFacts = facts.filter((f) =>
    ["traditional_power_eliminated", "defending_champion_eliminated", "title_favorite_eliminated_early"].includes(f.id)
  )
  for (const f of eventFacts) c += f.editorialWeight / 100

  for (const a of arcs) c += a.editorialWeight / 100

  for (const f of facts) c += f.editorialWeight / 500

  const factIds = facts.map((f) => f.id)
  if (factIds.includes("first_title_ever")) c += 0.15
  if (factIds.includes("title_drought_ended")) c += 0.10
  if (factIds.includes("repeat_final")) c += 0.10
  if (factIds.includes("back_to_back_final")) c += 0.08
  if (factIds.includes("best_result_surpassed")) c += 0.12

  if (match.stage === "Final") c += 0.5
  else if (match.stage === "Semifinal") c += 0.3
  else if (match.stage === "Mata-mata") c += 0.2

  if (match.competitionImpact.eliminated && isPopular(match.loser || "")) c += 0.3

  if (match.narrativeFlags.includes("penalty_drama")) c += 0.15
  if (match.narrativeFlags.includes("upset")) c += 0.15

  const isGroupsStage = match.stage === "Fase de grupos"
  const isPopularHome = isPopular(match.homeTeam)
  const isPopularAway = isPopular(match.awayTeam)
  const isAnyPopular = isPopularHome || isPopularAway
  const hasDramaticFlag = match.narrativeFlags.includes("comeback") || match.narrativeFlags.includes("upset") || match.narrativeFlags.includes("blowout")
  const lowNarrativeContext = facts.length === 0 && arcs.length === 0

  if (isGroupsStage && lowNarrativeContext) {
    if (isLive && isAnyPopular) c += 0.30
    else if (match.winner && isAnyPopular && hasDramaticFlag) c += 0.25
    else if (match.winner && isAnyPopular) c += 0.20
    else if (isLive) c += 0.10
    else if (match.winner && hasDramaticFlag) c += 0.15
    else if (match.winner) c += 0.05
  }

  return Math.min(c, 1.0)
}

function buildEvidence(
  match: EnrichedMatch,
  arcs: NarrativeArc[],
  facts: HistoricalFact[]
): string[] {
  const ev: string[] = []

  if (match.stage === "Final") ev.push("É a final da Copa")
  if (match.competitionImpact.eliminated && isPopular(match.loser || ""))
    ev.push(`${match.loser} — uma das maiores seleções do mundo — foi eliminado`)
  if (match.narrativeFlags.includes("penalty_drama"))
    ev.push("Decisão dramática nos pênaltis")
  if (match.narrativeFlags.includes("upset"))
    ev.push("Resultado surpreendente que contrariou as expectativas")

  if (match.stage === "Fase de grupos" && match.winner) {
    const info = getTeamInfo(match.winner)
    if (info) {
      if (info.firstWorldCup === 2026) {
        ev.push(`${match.winner} faz sua estreia em Copas do Mundo`)
      } else {
        const participations = (2026 - info.firstWorldCup) / 4 + 1
        if (info.isTraditional) {
          ev.push(`${match.winner} é uma das seleções mais tradicionais do mundo`)
        } else if (info.continent === "CAF") {
          ev.push(`${match.winner} representa o continente africano`)
        } else if (info.continent === "AFC") {
          ev.push(`${match.winner} representa a Ásia na Copa`)
        } else if (info.bestResult && info.bestResult !== "Group stage") {
          ev.push(`${match.winner} busca repetir seu melhor resultado: ${info.bestResult}`)
        } else if (match.matchday && match.matchday >= 2 && match.teamForm.lost_opener) {
          ev.push(`${match.winner} se recupera após derrota na estreia`)
        } else if (match.teamForm.current_streak >= 2) {
          ev.push(`${match.winner} não perde há ${match.teamForm.current_streak} jogos na Copa`)
        } else {
          ev.push(`${match.winner} busca classificação rumo às oitavas de final`)
        }
      }
    } else if (ev.length === 0) {
      ev.push(`${match.winner} busca classificação rumo às oitavas de final`)
    }
  }

  for (const f of facts) {
    if (f.id === "first_title_ever") ev.push(`Pode conquistar seu primeiro título mundial`)
    else if (f.id === "title_drought_ended") ev.push(`Pode encerrar jejum de ${f.description.match(/\d+/)?.[0] || "longos"} anos sem título`)
    else if (f.id === "repeat_final") ev.push(`Primeira vez que a mesma final se repete desde 1998`)
    else if (f.id === "back_to_back_final") ev.push(`Primeira final consecutiva desde 1998`)
    else if (f.id === "best_result_surpassed") ev.push(`Superou o melhor resultado da história do país`)
    else ev.push(f.description)
  }
  for (const a of arcs) ev.push(a.summary)

  return ev
}

function extractGroupLabel(round: string): string | null {
  const m = round.match(/Grupo ([A-L])/)
  return m ? `Grupo ${m[1]}` : null
}

function buildHeadline(match: EnrichedMatch, storyType: EditorialStoryType): string {
  const md = match.matchday
  const isFirstMd = md === 1
  const isSecondMd = md === 2
  const isFinalMd = md === 3
  const winnerInfo = match.winner ? getTeamInfo(match.winner) : null
  const isWinnerPopular = match.winner ? isPopular(match.winner) : false
  const isWinnerDebutant = winnerInfo?.firstWorldCup === 2026
  const hasStreak = match.teamForm.current_streak >= 2
  const isRecovering = match.teamForm.lost_opener
  const groupLabel = extractGroupLabel(match.round)

  // ─── Live matches ──────────────────────────────────────
  if (match.isLive && match.winner) {
    if (match.homeScore !== null && match.awayScore !== null && match.homeScore + match.awayScore >= 4) {
      return `${match.winner} ao vivo: ${match.homeScore}–${match.awayScore} e mantém grupo aberto`
    }
    if (isWinnerPopular) {
      return `${match.winner} ao vivo: vence e dá passo firme rumo à próxima fase`
    }
    return `${match.winner} ao vivo: vence provisoriamente contra ${match.loser}`
  }

  // ─── Special stages ────────────────────────────────────
  if (match.stage === "Final" && match.winner)
    return `${match.winner} é campeão mundial`
  if (match.penaltyScore && match.winner && match.loser)
    return `${match.winner} elimina ${match.loser} nos pênaltis`
  if (match.narrativeFlags.includes("upset") && match.winner && match.loser)
    return `${match.winner} surpreende ${match.loser}`
  if (match.winner && match.loser && match.stage !== "Fase de grupos")
    return `${match.winner} elimina ${match.loser} e avança`

  // ─── Group stage ───────────────────────────────────────
  if (match.winner && match.loser && match.stage === "Fase de grupos") {
    if (match.narrativeFlags.includes("comeback")) {
      return isRecovering
        ? `${match.winner} reage e vira ${match.loser} no grupo`
        : `${match.winner} vira ${match.loser} e segura primeira vitória`
    }

    if (match.narrativeFlags.includes("blowout")) {
      const homeScore = match.homeScore ?? 0
      const awayScore = match.awayScore ?? 0
      const goalDiff = Math.abs(homeScore - awayScore)
      const cleanSheet = homeScore === 0 || awayScore === 0

      if (cleanSheet && goalDiff >= 4) {
        return isWinnerPopular
          ? `${match.winner} aplica goleada e mostra força no grupo`
          : `${match.winner} surpreende com goleada histórica`
      }
      if (goalDiff >= 3) {
        return isWinnerPopular
          ? `${match.winner} domina e vence com autoridade`
          : `${match.winner} vence com folga e ganha destaque`
      }
      return isWinnerPopular
        ? `${match.winner} atropela ${match.loser} e assume liderança`
        : `${match.winner} domina ${match.loser} em partida equilibrada`
    }

    if (match.narrativeFlags.includes("upset")) {
      return `${match.winner} surpreende ${match.loser} e equilibra o grupo`
    }

    // Matchday-based headlines
    if (isFinalMd && isWinnerPopular) {
      return `${match.winner} carimba vaga nas oitavas de final`
    }
    if (isFinalMd) {
      return `${match.winner} decide vaga na última rodada`
    }
    if (isSecondMd && isRecovering) {
      return `${match.winner} reage após tropeço inicial`
    }
    if (isSecondMd && hasStreak) {
      return `${match.winner} confirma na segunda rodada`
    }
    if (isSecondMd) {
      return isWinnerPopular
        ? `${match.winner} embala com mais uma vitória`
        : `${match.winner} busca recuperação no grupo`
    }
    if (isWinnerDebutant) {
      return `${match.winner} estreia vencendo${groupLabel ? ` no ${groupLabel}` : ""}`
    }
    if (isFirstMd && isWinnerPopular) {
      return `${match.winner} estreia com vitória no grupo`
    }
    if (isFirstMd) {
      return `${match.winner} abre campanha vencendo ${match.loser}`
    }

    // Fallback by popularity
    if (isWinnerPopular) {
      return `${match.winner} vence ${match.loser} e assume liderança do grupo`
    }
    return `${match.winner} vence ${match.loser}`
  }

  if (match.winner && match.loser)
    return `${match.winner} vence ${match.loser}`
  return `${match.homeTeam} vs ${match.awayTeam}`
}

function buildHook(match: EnrichedMatch, arcs: NarrativeArc[], facts: HistoricalFact[]): string {
  const eventFacts = facts.filter((f) =>
    ["traditional_power_eliminated", "defending_champion_eliminated", "title_favorite_eliminated_early"].includes(f.id)
  )

  if (eventFacts.length > 0 && match.loser && isPopular(match.loser))
    return `O mundo do futebol está de cabeça para baixo. ${match.loser} está fora da Copa.`

  if (arcs.some((a) => a.type === "redemption_journey"))
    return "A história mais improvável da Copa continua sendo escrita."

  if (arcs.some((a) => a.type === "cinderella_progression" || a.type === "giant_slayer"))
    return `O time que ninguém levava a sério acabou de eliminar mais uma favorita.`

  if (facts.some((f) => f.id === "first_african_semifinalist"))
    return "O que parecia impossível há quatro anos, hoje é realidade."

  if (match.narrativeFlags.includes("penalty_drama"))
    return "A disputa de pênaltis decidiu o destino de um gigante."

  if (match.narrativeFlags.includes("upset"))
    return "O torneio continua desafiando todas as previsões."

  if (match.isLive && facts.length === 0 && arcs.length === 0) {
    if (isPopular(match.winner || match.homeTeam)) {
      return "O torneio está acontecendo agora — o time favorito está em campo."
    }
    return "Surpresa em andamento — o torneio reservou emoção para agora."
  }

  if (match.stage === "Fase de grupos" && facts.length === 0 && arcs.length === 0) {
    if (match.matchday === 1) return "Os primeiros capítulos da Copa começam a ser escritos."
    if (match.matchday === 3) return "Definições começam a acontecer na reta final dos grupos."
    return "Os contornos dos grupos começam a se definir."
  }

  return "O resultado do dia:"
}

function buildWhyItMatters(match: EnrichedMatch, arcs: NarrativeArc[]): string {
  // Live matches
  if (match.isLive && match.winner) {
    if (isPopular(match.winner)) {
      return `${match.winner} ao vivo confirma favoritismo. Vitória deixaria classificação quase garantida.`
    }
    return `${match.winner} está vencendo ao vivo. Resultado surpreendente se confirmar.`
  }

  if (match.competitionImpact.eliminated)
    return `${match.loser} está eliminado. ${match.winner} segue vivo na competição.`
  if (match.stage === "Final" && match.winner)
    return `${match.winner} conquista o título mais importante do futebol.`
  if (arcs.some((a) => a.type === "redemption_journey"))
    return "Uma campanha de superação que será lembrada por gerações."
  if (match.narrativeFlags.includes("upset"))
    return "Resultado que muda completamente as projeções para o resto do torneio."

  // Group stage
  if (match.stage === "Fase de grupos") {
    const md = match.matchday
    const isWinnerPopular = match.winner ? isPopular(match.winner) : false
    const winnerInfo = match.winner ? getTeamInfo(match.winner) : null
    const opponent = match.winner ? (match.winner === match.homeTeam ? match.awayTeam : match.homeTeam) : null
    const opponentInfo = opponent ? getTeamInfo(opponent) : null

    // Debutant won or lost
    if (winnerInfo?.firstWorldCup === 2026) {
      return `${match.winner} conquista primeira vitória em Copas. Estreia histórica para o país.`
    }
    if (opponentInfo?.firstWorldCup === 2026 && match.winner) {
      return `${opponent} estreia em Copas e já enfrentou um favorito. Experiência valiosa.`
    }

    // Matchday context
    if (md === 1 && isWinnerPopular) {
      return "Primeira impressão positiva no grupo. Favorito confirma expectativa inicial."
    }
    if (md === 1) {
      return "Campanha começa com vitória. Primeiro passo em busca da classificação."
    }
    if (md === 3 && isWinnerPopular) {
      return "Classificação encaminhada. Time tradicional confirma favoritismo na reta final."
    }
    if (md === 3) {
      return "Rodada decisiva. Resultado pode definir o futuro do time no torneio."
    }

    // Recovery
    if (match.teamForm.lost_opener && match.winner) {
      return "Recuperação importante após derrota na estreia. Grupo segue aberto."
    }

    // Streak
    if (match.teamForm.current_streak >= 2 && match.winner) {
      return "Sequência positiva aproxima o time da classificação às oitavas de final."
    }

    // Generic fallback
    if (match.winner && isWinnerPopular) {
      return `${match.winner} assume a liderança. Vitória deixa classificação perto de ser confirmada.`
    }
    if (match.winner) {
      return `${match.winner} dá primeiro passo rumo à classificação no grupo.`
    }
    if (isPopular(match.homeTeam)) {
      return `${match.homeTeam} faz sua estreia na Copa hoje. Vitória é esperada para o favorito do grupo.`
    }
  }

  return `Partida válida pela ${match.round}.`
}

function buildTag(storyType: EditorialStoryType): string {
  const tags: Record<EditorialStoryType, string> = {
    redemption: "🔥 Redenção",
    historical: "🏆 Histórico",
    upset: "⚡ Zebra",
    elimination: "❌ Eliminação",
    dynasty_fall: "💥 Queda de gigante",
    cinderella: "🌟 Jornada histórica",
    milestone: "📜 Marco histórico",
    rivalry: "⚔️ Clássico",
    favorite_stumbles: "🟡 Favorito tropeça",
    statement_win: "🔵 Demonstração de força",
  }
  return tags[storyType]
}

function arcsForMatch(match: EnrichedMatch, allArcs: NarrativeArc[]): NarrativeArc[] {
  return allArcs.filter(
    (a) => a.team === match.winner || a.team === match.loser || a.team === match.homeTeam
  )
}

function factsForMatch(match: EnrichedMatch, allFacts: HistoricalFact[]): HistoricalFact[] {
  return allFacts.filter(
    (f) => f.appliesTo === match.winner || f.appliesTo === match.loser || f.appliesTo === match.homeTeam
  )
}

function isMatchLive(matchId: string, rawMatches?: Match[]): boolean {
  if (!rawMatches) return false
  const raw = rawMatches.find((m) => m.id === matchId)
  return raw?.status === "live" || false
}

export function selectStories(
  enrichedMatches: EnrichedMatch[],
  memory?: TournamentMemory,
  rawMatches?: Match[]
): EditorialStory[] {
  const stories: EditorialStory[] = []
  const allArcs = memory?.narrativeArcs || []
  const allFacts = memory?.historicalFacts || []
  const finished = enrichedMatches.filter((m) => m.homeScore !== null || m.awayScore !== null)

  for (const match of finished) {
    const arcs = arcsForMatch(match, allArcs)
    const facts = factsForMatch(match, allFacts)
    const isLive = isMatchLive(match.matchId, rawMatches)
    const storyType = classifyStoryType(match, arcs, facts)
    const confidence = calcConfidence(match, arcs, facts, isLive)
    const evidence = buildEvidence(match, arcs, facts)
    const headline = buildHeadline(match, storyType)
    const narrativeHook = buildHook(match, arcs, facts)
    const whyItMatters = buildWhyItMatters(match, arcs)

    if (confidence < 0.05) continue

    stories.push({
      id: `story-${match.matchId}`,
      headline,
      storyType,
      confidence: Math.round(confidence * 100) / 100,
      evidence,
      narrativeHook,
      whyItMatters,
      priority: 0,
      matchId: match.matchId,
      tag: buildTag(storyType),
    })
  }

  stories.sort((a, b) => b.confidence - a.confidence)

  stories.forEach((s, i) => { s.priority = i + 1 })
  if (stories.length > 0) stories[0].priority = 1
  if (stories.length > 1) stories[1].priority = 2
  if (stories.length > 2) stories[2].priority = 3

  return stories
}

export function getHeroStory(stories: EditorialStory[]): EditorialStory | null {
  return stories.find((s) => s.priority === 1) || null
}

export function getSecondaryStory(stories: EditorialStory[]): EditorialStory | null {
  return stories.find((s) => s.priority === 2) || null
}

export function getEmergingStory(stories: EditorialStory[]): EditorialStory | null {
  return stories.find((s) => s.priority === 3) || null
}
