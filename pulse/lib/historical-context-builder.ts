import type { EnrichedMatch, HistoricalFact, TournamentMemory } from "./types"
import { getFifaRank, getLastTitle, getTitles, isAfrican, isTraditional, getTeamInfo, wasFinalInPreviousEdition, wasInFinalConsecutively, getPreviousChampion } from "./knowledge"

const TOURNAMENT_YEAR = 2026

export function buildHistoricalFacts(
  match: EnrichedMatch,
  memory?: TournamentMemory
): HistoricalFact[] {
  const facts: HistoricalFact[] = []
  const { winner, loser, stage, narrativeFlags, homeTeam, awayTeam } = match

  for (const team of [winner, loser, homeTeam, awayTeam].filter(Boolean) as string[]) {
    const africanSemi = detectFirstAfricanSemifinalist(team, match)
    if (africanSemi) facts.push(africanSemi)
  }

  const giantKilling = detectGiantKilling(match)
  if (giantKilling) facts.push(giantKilling)

  const lastTitle = detectYearsSinceLastTitle(match)
  if (lastTitle) facts.push(lastTitle)

  const defending = detectDefendingChampionEliminated(match)
  if (defending) facts.push(defending)

  const streak = detectStreakBroken(match, memory)
  if (streak) facts.push(streak)

  const firstTitle = detectFirstTitleEver(match)
  if (firstTitle) facts.push(firstTitle)

  const droughtEnded = detectTitleDroughtEnded(match)
  if (droughtEnded) facts.push(droughtEnded)

  const repeatFinal = detectRepeatFinal(match)
  if (repeatFinal) facts.push(repeatFinal)

  const backToBack = detectBackToBackFinal(match)
  if (backToBack) facts.push(backToBack)

  const bestResult = detectBestResultSurpassed(match)
  if (bestResult) facts.push(bestResult)

  return facts
}

function detectFirstAfricanSemifinalist(team: string, match: EnrichedMatch): HistoricalFact | null {
  if (match.stage !== "Mata-mata" || !match.winner) return null
  if (!isAfrican(team) || team !== match.winner) return null
  return {
    id: "first_african_semifinalist",
    editorialWeight: 95,
    description: `${team} é a primeira seleção africana a chegar em uma semifinal de Copa do Mundo`,
    appliesTo: team,
  }
}

function detectGiantKilling(match: EnrichedMatch): HistoricalFact | null {
  if (!match.winner || !match.loser) return null
  const winnerRank = getFifaRank(match.winner)
  const loserRank = getFifaRank(match.loser)
  if (winnerRank === null || loserRank === null) return null
  const diff = loserRank - winnerRank
  if (diff < 10) return null
  return {
    id: "giant_killing",
    editorialWeight: 85,
    description: `${match.winner} (${winnerRank}º) venceu ${match.loser} (${loserRank}º) — diferença de ${diff} posições`,
    appliesTo: match.winner,
  }
}

function detectYearsSinceLastTitle(match: EnrichedMatch): HistoricalFact | null {
  const candidates = [match.winner, match.loser].filter(Boolean) as string[]
  const team = candidates.find((t) => getLastTitle(t) !== null)
  if (!team) return null
  const lastTitle = getLastTitle(team)
  if (lastTitle === null) return null
  const years = TOURNAMENT_YEAR - lastTitle
  if (years < 8) return null
  return {
    id: "years_since_last_title",
    editorialWeight: years > 20 ? 90 : 70,
    description: `${team} não vencia a Copa desde ${lastTitle} — há ${years} anos`,
    appliesTo: team,
  }
}

function detectDefendingChampionEliminated(match: EnrichedMatch): HistoricalFact | null {
  if (!match.competitionImpact.eliminated || !match.loser) return null
  const titles = getTitles(match.loser)
  if (titles === 0) return null
  const lastTitle = getLastTitle(match.loser)
  if (lastTitle === null) return null
  const yearsSinceTitle = TOURNAMENT_YEAR - lastTitle
  if (yearsSinceTitle > 8) return null
  return {
    id: "defending_champion_eliminated",
    editorialWeight: 85,
    description: `${match.loser}, atual campeã mundial (${lastTitle}), foi eliminada`,
    appliesTo: match.loser,
  }
}

function detectStreakBroken(match: EnrichedMatch, memory?: TournamentMemory): HistoricalFact | null {
  if (!match.loser || match.stage !== "Fase de grupos") return null
  if (!match.narrativeFlags.includes("upset")) return null
  const teamForm = memory?.teamForm?.[match.loser]
  if (!teamForm) return null
  if (teamForm.momentum !== "dominant" && !teamForm.lost_opener) return null
  return {
    id: "streak_broken",
    editorialWeight: 80,
    description: `${match.loser} teve sua sequência invicta quebrada neste jogo`,
    appliesTo: match.loser,
  }
}

// ─── NEW FACTS ────────────────────────────────────────────

function detectFirstTitleEver(match: EnrichedMatch): HistoricalFact | null {
  if (!match.winner) return null
  const info = getTeamInfo(match.winner)
  if (!info) return null
  if (info.titles > 0) return null
  if (match.stage !== "Final") {
    if (match.stage === "Fase de grupos") return null
    return {
      id: "first_title_ever",
      editorialWeight: 85,
      description: `${match.winner} pode conquistar seu primeiro título mundial`,
      appliesTo: match.winner,
    }
  }
  return null
}

function detectTitleDroughtEnded(match: EnrichedMatch): HistoricalFact | null {
  if (!match.winner || match.stage !== "Final") return null
  const lastTitle = getLastTitle(match.winner)
  if (lastTitle === null) return null
  const years = TOURNAMENT_YEAR - lastTitle
  if (years < 8) return null
  return {
    id: "title_drought_ended",
    editorialWeight: 90,
    description: `${match.winner} pode encerrar um jejum de ${years} anos sem título mundial`,
    appliesTo: match.winner,
  }
}

function detectRepeatFinal(match: EnrichedMatch): HistoricalFact | null {
  if (match.stage !== "Final") return null
  if (wasFinalInPreviousEdition(match.homeTeam, match.awayTeam)) {
    return {
      id: "repeat_final",
      editorialWeight: 85,
      description: `Repetição da final anterior: ${match.homeTeam} vs ${match.awayTeam} se enfrentaram na decisão anterior também`,
      appliesTo: "both",
    }
  }
  return null
}

function detectBackToBackFinal(match: EnrichedMatch): HistoricalFact | null {
  if (match.stage !== "Final") return null
  for (const team of [match.homeTeam, match.awayTeam]) {
    if (wasInFinalConsecutively(team)) {
      return {
        id: "back_to_back_final",
        editorialWeight: 80,
        description: `${team} está em sua segunda final consecutiva de Copa do Mundo`,
        appliesTo: team,
      }
    }
  }
  return null
}

const STAGE_ORDER: Record<string, number> = {
  "Group stage": 0,
  "Fase de grupos": 0,
  "Round of 16": 1,
  "Quarter-finals": 2,
  "Mata-mata": 2,
  "Semifinals": 3,
  "Semifinal": 3,
  "Runner-up": 4,
  "Final": 4,
  "Champion": 5,
}

function stageValue(s: string): number {
  return STAGE_ORDER[s] ?? -1
}

function detectBestResultSurpassed(match: EnrichedMatch): HistoricalFact | null {
  if (!match.winner && !match.loser) return null
  for (const team of [match.winner, match.loser].filter(Boolean) as string[]) {
    const info = getTeamInfo(team)
    if (!info) continue
    const current = stageValue(match.stage)
    const best = stageValue(info.bestResult)
    if (current > best) {
      return {
        id: "best_result_surpassed",
        editorialWeight: 90,
        description: `${team} superou seu melhor resultado histórico: antes chegou até ${info.bestResult}, agora está na ${match.stage}`,
        appliesTo: team,
      }
    }
  }
  return null
}
