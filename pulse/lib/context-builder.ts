import type { Match, EnrichedMatch, NarrativeFlag, StoryCandidate, HistoricalContext, TeamFormEntry } from "./types"

const POPULAR_TEAMS = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain", "uruguay",
]

function isPopular(name: string): boolean {
  return POPULAR_TEAMS.some((t) => name.toLowerCase().includes(t))
}

function isKnockout(stage: string): boolean {
  return stage === "Mata-mata" || stage === "Semifinal" || stage === "Final"
}

function detectFlags(m: Match): NarrativeFlag[] {
  const flags: NarrativeFlag[] = []
  const homeWon = m.homeScore !== null && m.awayScore !== null && m.homeScore > m.awayScore
  const awayWon = m.homeScore !== null && m.awayScore !== null && m.awayScore > m.homeScore

  if (isKnockout(m.stage)) flags.push("high_stakes")

  if (homeWon) {
    if (!isPopular(m.homeTeam.name) && isPopular(m.awayTeam.name)) {
      flags.push("upset")
    } else if (isPopular(m.homeTeam.name)) {
      flags.push("big_team_win")
    }
  }

  if (awayWon) {
    if (!isPopular(m.awayTeam.name) && isPopular(m.homeTeam.name)) {
      flags.push("upset")
    } else if (isPopular(m.awayTeam.name)) {
      flags.push("big_team_win")
    }
  }

  if (m.penaltyScore) {
    flags.push("penalty_drama")
    flags.push("elimination")
  }

  if (m.homeScore !== null && m.awayScore !== null) {
    if (m.homeScore + m.awayScore >= 5) flags.push("blowout")
  }

  if (isKnockout(m.stage)) {
    if (homeWon || awayWon || !!m.penaltyScore) flags.push("elimination")
  }

  return flags
}

function detectStories(m: Match, flags: NarrativeFlag[]): StoryCandidate[] {
  const stories: StoryCandidate[] = []

  if (flags.includes("upset")) {
    stories.push({ type: "underdog", score: 92, reason: "Vitória surpreendente sobre favorito" })
  }

  if (flags.includes("penalty_drama")) {
    stories.push({ type: "elimination", score: 95, reason: "Eliminação nos pênaltis" })
    stories.push({ type: "redemption", score: 80, reason: "Decisão emocionante nos pênaltis" })
  }

  if (isKnockout(m.stage) && (m.homeScore !== null || m.awayScore !== null)) {
    if (!flags.includes("penalty_drama")) {
      stories.push({ type: "elimination", score: 88 })
      stories.push({ type: "qualification", score: 85 })
    }
  }

  if (flags.includes("big_team_win") && isKnockout(m.stage)) {
    stories.push({ type: "legacy", score: 70 })
  }

  if (flags.includes("blowout") && isKnockout(m.stage)) {
    stories.push({ type: "breakthrough", score: 65 })
  }

  return stories
}

function buildSimpleImpact(m: Match, flags: NarrativeFlag[]): EnrichedMatch["simpleImpact"] {
  const winner = m.homeScore !== null && m.awayScore !== null
    ? m.homeScore > m.awayScore ? m.homeTeam.name : m.awayScore > m.homeScore ? m.awayTeam.name : null
    : null
  const loser = m.homeScore !== null && m.awayScore !== null
    ? m.homeScore < m.awayScore ? m.homeTeam.name : m.awayScore < m.homeScore ? m.awayTeam.name : null
    : null

  if (isKnockout(m.stage)) {
    if (m.penaltyScore) {
      return {
        classification: `Decisão nos pênaltis (${m.penaltyScore})`,
        consequence: `${m.homeTeam.name} e ${m.awayTeam.name} empataram no tempo normal`,
        tournamentEffect: `Um dos times está eliminado nos pênaltis.`,
      }
    }
    if (winner) {
      return {
        classification: `${winner} avançou às próximas fases`,
        consequence: `${winner} enfrentará o vencedor do próximo confronto`,
        tournamentEffect: loser ? `${loser} foi eliminado da competição` : "O torneio segue",
      }
    }
  }

  return {
    classification: `${m.homeTeam.name} ${m.homeScore ?? "?"} × ${m.awayScore ?? "?"} ${m.awayTeam.name}`,
    consequence: flags.includes("upset") ? "Resultado surpreendente" : "Partida de grupos",
    tournamentEffect: "Classificação atualizada",
  }
}

function buildHistoricalContext(m: Match): HistoricalContext {
  return {
    first_african_semifinalist: isKnockout(m.stage) && (
      m.homeTeam.name.toLowerCase().includes("marrocos") ||
      m.awayTeam.name.toLowerCase().includes("marrocos")
    ),
    defending_champion: false,
    host_nation: false,
    years_since_last_title: null,
  }
}

function buildTeamForm(m: Match, allMatches: Match[]): TeamFormEntry {
  const homeMatches = allMatches
    .filter((x) => x.status === "finished" && (x.homeTeam.name === m.homeTeam.name || x.awayTeam.name === m.homeTeam.name))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const firstMatch = homeMatches[0]
  const lostOpener = firstMatch
    ? (firstMatch.homeTeam.name === m.homeTeam.name
      ? (firstMatch.homeScore ?? 0) < (firstMatch.awayScore ?? 0)
      : (firstMatch.awayScore ?? 0) < (firstMatch.homeScore ?? 0))
    : false

  let streak = 0
  for (let i = homeMatches.length - 1; i >= 0; i--) {
    const x = homeMatches[i]
    const isHome = x.homeTeam.name === m.homeTeam.name
    const scored = isHome ? x.homeScore : x.awayScore
    const conceded = isHome ? x.awayScore : x.homeScore
    if (scored !== null && conceded !== null && scored >= conceded) streak++
    else break
  }

  const totalWon = homeMatches.filter((x) => {
    const isHome = x.homeTeam.name === m.homeTeam.name
    const s = isHome ? x.homeScore : x.awayScore
    const c = isHome ? x.awayScore : x.homeScore
    return s !== null && c !== null && s > c
  }).length

  let momentum: TeamFormEntry["momentum"] = "neutral"
  if (lostOpener && totalWon >= 2) momentum = "recovering"
  else if (totalWon === homeMatches.length && homeMatches.length >= 2) momentum = "dominant"
  else if (totalWon === 0 && homeMatches.length >= 2) momentum = "struggling"

  return { lost_opener: lostOpener, current_streak: streak, momentum }
}

export function enrichMatches(matches: Match[], allMatches?: Match[]): EnrichedMatch[] {
  const pool = allMatches || matches
  return matches
    .filter((m) => {
      if (m.status === "finished") return m.importanceScore > 0
      if (m.status === "live") {
        const hasScore = m.homeScore !== null && m.awayScore !== null && (m.homeScore > 0 || m.awayScore > 0)
        return hasScore
      }
      return false
    })
    .map((m) => {
      const flags = detectFlags(m)
      const winner = m.homeScore !== null && m.awayScore !== null
        ? m.homeScore > m.awayScore ? m.homeTeam.name : m.awayScore > m.homeScore ? m.awayTeam.name : null
        : null
      const loser = m.homeScore !== null && m.awayScore !== null
        ? m.homeScore < m.awayScore ? m.homeTeam.name : m.awayScore < m.homeScore ? m.awayTeam.name : null
        : null

      let penaltyWinner: string | null = null
      if (m.penaltyScore) {
        const [h, a] = m.penaltyScore.split("-").map(Number)
        penaltyWinner = h > a ? m.homeTeam.name : m.awayTeam.name
      }

      return {
        matchId: m.id,
        matchday: m.matchday,
        isLive: m.status === "live",
        winner: m.penaltyScore ? penaltyWinner : winner,
        loser: m.penaltyScore ? (penaltyWinner === m.homeTeam.name ? m.awayTeam.name : m.homeTeam.name) : loser,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        penaltyScore: m.penaltyScore ?? null,
        score: m.homeScore !== null && m.awayScore !== null
          ? `${m.homeScore}–${m.awayScore}${m.penaltyScore ? ` (pen: ${m.penaltyScore})` : ""}`
          : "–",
        stage: m.stage,
        round: m.round,
        competitionImpact: {
          eliminated: isKnockout(m.stage) && (loser || m.penaltyScore)
            ? (m.penaltyScore
              ? (penaltyWinner === m.homeTeam.name ? m.awayTeam.name : m.homeTeam.name)
              : loser)
            : null,
          nextOpponent: null,
          qualified: isKnockout(m.stage) && (!!winner || !!m.penaltyScore),
        },
        narrativeFlags: flags,
        simpleImpact: buildSimpleImpact(m, flags),
        storyCandidates: detectStories(m, flags),
        historicalContext: buildHistoricalContext(m),
        teamForm: buildTeamForm(m, pool),
      }
    })
}
