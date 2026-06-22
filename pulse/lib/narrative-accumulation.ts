import type { Match, NarrativeArc } from "./types"

const POPULAR = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain", "uruguay",
]

function isPopular(name: string): boolean {
  return POPULAR.some((t) => name.toLowerCase().includes(t))
}

function teamMatches(team: string, all: Match[]): Match[] {
  return all
    .filter((m) => m.status === "finished" && (m.homeTeam.name === team || m.awayTeam.name === team))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

function isKnockout(stage: string): boolean {
  return stage === "Mata-mata" || stage === "Semifinal" || stage === "Final"
}

function getTeamScored(m: Match, team: string): { scored: number | null; conceded: number | null; opponent: string } {
  const isHome = m.homeTeam.name === team
  return {
    scored: isHome ? m.homeScore : m.awayScore,
    conceded: isHome ? m.awayScore : m.homeScore,
    opponent: isHome ? m.awayTeam.name : m.homeTeam.name,
  }
}

function allTeams(matches: Match[]): string[] {
  const set = new Set<string>()
  for (const m of matches) set.add(m.homeTeam.name), set.add(m.awayTeam.name)
  return Array.from(set)
}

// ─── Multi-Upset Run ──────────────────────────────────────

function detectMultiUpsetRun(team: string, matches: Match[]): NarrativeArc | null {
  const tm = teamMatches(team, matches)
  const groupWins = tm.filter((m) => {
    if (m.stage !== "Fase de grupos") return false
    const { scored, conceded, opponent } = getTeamScored(m, team)
    return scored !== null && conceded !== null && scored > conceded && isPopular(opponent)
  })

  if (groupWins.length < 2) return null

  const opponents = groupWins.map((m) => getTeamScored(m, team).opponent)
  const lastOpponent = opponents[opponents.length - 1]

  return {
    type: "multi_upset_run",
    team,
    editorialWeight: 85,
    description: `${team} venceu ${groupWins.length} favoritos na fase de grupos: ${opponents.join(" e ")}`,
    summary: `${team} derrotou ${opponents.join(" e ")}, duas campeãs mundiais, na mesma fase de grupos`,
  }
}

function haveWon(match: Match, team: string): boolean {
  const { scored, conceded } = getTeamScored(match, team)
  if (scored === null || conceded === null) return false
  if (scored > conceded) return true
  if (scored === conceded && match.penaltyScore !== undefined) return true // won on penalties
  return false
}

// ─── Cinderella Progression ────────────────────────────────

function detectCinderella(team: string, matches: Match[]): NarrativeArc | null {
  const tm = teamMatches(team, matches)
  const koWins = tm.filter((m) => {
    if (!isKnockout(m.stage)) return false
    const { opponent } = getTeamScored(m, team)
    return haveWon(m, team) && isPopular(opponent)
  })

  if (koWins.length < 2) return null

  const opponents = koWins.map((m) => getTeamScored(m, team).opponent)
  const isInSemi = tm.some((m) => m.stage === "Semifinal")

  return {
    type: "cinderella_progression",
    team,
    editorialWeight: 90,
    description: `${team} eliminou ${koWins.length} potências europeias: ${opponents.join(", ")}`,
    summary: `${team} segue surpreendendo e elimina ${isInSemi ? "mais uma potência" : "favoritos consecutivos"} para avançar no torneio`,
  }
}

// ─── Redemption Journey ────────────────────────────────────

function detectRedemption(team: string, matches: Match[]): NarrativeArc | null {
  const tm = teamMatches(team, matches)
  if (tm.length < 3) return null

  const first = tm[0]
  const { scored: firstScored, conceded: firstConceded } = getTeamScored(first, team)
  const lostOpener = firstScored !== null && firstConceded !== null && firstScored < firstConceded

  if (!lostOpener) return null

  const last = tm[tm.length - 1]
  const { scored: lastScored, conceded: lastConceded } = getTeamScored(last, team)
  const wonLast = lastScored !== null && lastConceded !== null && lastScored > lastConceded
  const isChampion = last.stage === "Final" && wonLast

  if (!isChampion && tm.length < 4) return null

  return {
    type: "redemption_journey",
    team,
    editorialWeight: isChampion ? 95 : 80,
    description: `${team} perdeu na estreia${isChampion ? " mas se recuperou para ser campeã" : " e buscou a recuperação"} — uma campanha de superação`,
    summary: `${team} transformou um início desastroso${isChampion ? " em título mundial" : " em campanha histórica"}`,
  }
}

// ─── Giant Slayer ──────────────────────────────────────────

function detectGiantSlayer(team: string, matches: Match[]): NarrativeArc | null {
  const tm = teamMatches(team, matches)
  const koWins = tm.filter((m) => {
    if (!isKnockout(m.stage)) return false
    const { opponent } = getTeamScored(m, team)
    return haveWon(m, team) && isPopular(opponent)
  })

  if (koWins.length < 2) return null

  const opponents = koWins.map((m) => getTeamScored(m, team).opponent)

  return {
    type: "giant_slayer",
    team,
    editorialWeight: 85,
    description: `${team} derrubou ${opponents.join(" e ")} para chegar onde está`,
    summary: `${team} eliminou ${opponents.join(" e ")}, duas favoritas ao título`,
  }
}

// ─── Main ──────────────────────────────────────────────────

export function detectArcs(matches: Match[]): NarrativeArc[] {
  const arcs: NarrativeArc[] = []
  const teams = allTeams(matches)

  for (const team of teams) {
    const multiUpset = detectMultiUpsetRun(team, matches)
    if (multiUpset) arcs.push(multiUpset)

    const cinderella = detectCinderella(team, matches)
    if (cinderella) arcs.push(cinderella)

    const redemption = detectRedemption(team, matches)
    if (redemption) arcs.push(redemption)

    const slayer = detectGiantSlayer(team, matches)
    if (slayer) arcs.push(slayer)
  }

  return arcs
}
