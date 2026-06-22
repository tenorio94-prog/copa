import type { Match, TournamentMemory, TeamFormEntry, HistoricalContext } from "./types"
import { detectArcs } from "./narrative-accumulation"

function teamMatches(team: string, all: Match[]): Match[] {
  return all
    .filter((m) => m.status === "finished" && (m.homeTeam.name === team || m.awayTeam.name === team))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

function describeMatch(m: Match, team: string): string {
  const isHome = m.homeTeam.name === team
  const opponent = isHome ? m.awayTeam.name : m.homeTeam.name
  const scored = isHome ? m.homeScore : m.awayScore
  const conceded = isHome ? m.awayScore : m.homeScore
  const isKO = m.stage === "Mata-mata" || m.stage === "Semifinal" || m.stage === "Final"

  if (m.penaltyScore) {
    if (scored !== null && conceded !== null && scored === conceded) {
      const [h, a] = m.penaltyScore.split("-").map(Number)
      const penaltyWinner = isHome ? (h > a ? team : opponent) : (a > h ? team : opponent)
      if (penaltyWinner === team) {
        return `Eliminou ${opponent} nos pênaltis (${m.penaltyScore}) após empate por ${scored}-${conceded}`
      }
      return `Eliminado por ${opponent} nos pênaltis (${m.penaltyScore}) após empate por ${scored}-${conceded}`
    }
  }

  if (scored !== null && conceded !== null) {
    if (scored > conceded) {
      if (isKO) return `Eliminou ${opponent} por ${scored}-${conceded}`
      return `Venceu ${opponent} por ${scored}-${conceded}`
    }
    if (scored < conceded) {
      if (isKO) return `Eliminado por ${opponent} por ${scored}-${conceded}`
      return `Perdeu para ${opponent} por ${scored}-${conceded}`
    }
    return `Empatou com ${opponent} por ${scored}-${conceded}`
  }

  return `Jogou contra ${opponent}`
}

function allTeams(matches: Match[]): string[] {
  const set = new Set<string>()
  for (const m of matches) {
    set.add(m.homeTeam.name)
    set.add(m.awayTeam.name)
  }
  return Array.from(set)
}

function isKO(stage: string): boolean {
  return stage === "Mata-mata" || stage === "Semifinal" || stage === "Final"
}

function detectNarratives(all: Match[]): string[] {
  const n: string[] = []
  const teams = allTeams(all)

  for (const team of teams) {
    const tm = teamMatches(team, all)
    if (tm.length < 2) continue

    const koMatches = tm.filter((m) => m.stage !== "Fase de grupos")
    const groupMatches = tm.filter((m) => m.stage === "Fase de grupos")
    const isChampion = tm.some((m) => {
      if (m.stage !== "Final") return false
      if (m.penaltyScore) {
        const [h, a] = m.penaltyScore.split("-").map(Number)
        return m.homeTeam.name === team ? h > a : a > h
      }
      return m.homeTeam.name === team ? (m.homeScore ?? 0) > (m.awayScore ?? 0) : (m.awayScore ?? 0) > (m.homeScore ?? 0)
    })
    const lostEarly = groupMatches.some((m) => {
      const isHome = m.homeTeam.name === team
      return isHome ? (m.homeScore ?? 0) < (m.awayScore ?? 0) : (m.awayScore ?? 0) < (m.homeScore ?? 0)
    })
    const reachedFinal = tm.some((m) => m.stage === "Final")
    const upsetWins = groupMatches.filter((m) => {
      const isHome = m.homeTeam.name === team
      const opponent = isHome ? m.awayTeam.name : m.homeTeam.name
      const scored = isHome ? m.homeScore : m.awayScore
      const conceded = isHome ? m.awayScore : m.homeScore
      const POPULAR = ["brazil", "argentina", "germany", "france", "england", "portugal", "spain"]
      const isUnderdog = !POPULAR.some((p) => team.toLowerCase().includes(p))
      const isFavorite = POPULAR.some((p) => opponent.toLowerCase().includes(p))
      return isUnderdog && isFavorite && scored !== null && conceded !== null && scored > conceded
    })

    if (lostEarly && reachedFinal && !isChampion) {
      n.push(`${team} se recuperou após um início difícil e chegou até a final`)
    }
    if (isChampion && lostEarly) {
      n.push(`${team} perdeu na estreia mas se recuperou para ser campeão`)
    }
    if (upsetWins.length >= 2) {
      n.push(`${team} surpreendeu ao eliminar dois ou mais favoritos na competição`)
    }
    if (koMatches.length > 0 && !reachedFinal) {
      const uniqueStages = [...new Set(koMatches.map((m) => m.stage))]
      if (uniqueStages.includes("Semifinal")) {
        n.push(`${team} fez história ao chegar na semifinal`)
      }
    }
  }

  return n
}

function computeTeamForm(all: Match[]): Record<string, TeamFormEntry> {
  const form: Record<string, TeamFormEntry> = {}
  const teams = allTeams(all)

  for (const team of teams) {
    const tm = teamMatches(team, all)
    if (tm.length === 0) continue

    const firstMatch = tm[0]
    const lostOpener = firstMatch
      ? (firstMatch.homeTeam.name === team
        ? (firstMatch.homeScore ?? 0) < (firstMatch.awayScore ?? 0)
        : (firstMatch.awayScore ?? 0) < (firstMatch.homeScore ?? 0))
      : false

    let streak = 0
    for (let i = tm.length - 1; i >= 0; i--) {
      const x = tm[i]
      const isHome = x.homeTeam.name === team
      const scored = isHome ? x.homeScore : x.awayScore
      const conceded = isHome ? x.awayScore : x.homeScore
      if (scored !== null && conceded !== null && scored >= conceded) streak++
      else break
    }

    const totalWon = tm.filter((x) => {
      const isHome = x.homeTeam.name === team
      const s = isHome ? x.homeScore : x.awayScore
      const c = isHome ? x.awayScore : x.homeScore
      return s !== null && c !== null && s > c
    }).length

    let momentum: TeamFormEntry["momentum"] = "neutral"
    if (lostOpener && totalWon >= 2) momentum = "recovering"
    else if (totalWon === tm.length && tm.length >= 2) momentum = "dominant"
    else if (totalWon === 0 && tm.length >= 2) momentum = "struggling"

    form[team] = { lost_opener: lostOpener, current_streak: streak, momentum }
  }

  return form
}

function computeHistoricalContexts(all: Match[]): Record<string, HistoricalContext> {
  const ctx: Record<string, HistoricalContext> = {}
  const teams = allTeams(all)

  for (const team of teams) {
    const reachedSemifinal = all.some((m) =>
      (m.homeTeam.name === team || m.awayTeam.name === team) &&
      m.stage === "Semifinal"
    )
    ctx[team] = {
      first_african_semifinalist: reachedSemifinal && team.toLowerCase().includes("marrocos"),
      defending_champion: false,
      host_nation: false,
      years_since_last_title: null,
    }
  }

  return ctx
}

export function buildMemory(matches: Match[]): TournamentMemory {
  const teams = allTeams(matches)

  const teamJourneys: Record<string, string[]> = {}
  for (const team of teams) {
    const tm = teamMatches(team, matches)
    teamJourneys[team] = tm.map((m) => describeMatch(m, team))
  }

  const narratives = detectNarratives(matches)
  const teamForm = computeTeamForm(matches)
  const historicalContexts = computeHistoricalContexts(matches)
  const narrativeArcs = detectArcs(matches)

  return { teamJourneys, narratives, teamForm, historicalContexts, historicalFacts: [], narrativeArcs }
}
