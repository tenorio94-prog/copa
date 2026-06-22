import teamsData from "../data/teams.json"
import historyData from "../data/world-cup-history.json"

export interface TeamInfo {
  titles: number
  finals: number
  semifinals: number
  firstWorldCup: number
  lastWorldCup: number
  lastTitle: number | null
  bestResult: string
  isTraditional: boolean
  continent: string
}

const TEAMS = teamsData as Record<string, TeamInfo>
const HISTORY = historyData as { year: number; host: string; champion: string; runnerUp: string; third: string }[]

// Map variants (West Germany → Germany for matching)
const NAME_MAP: Record<string, string> = {
  "west germany": "Germany",
  "czechoslovakia": "Czech Republic",
  "korea republic": "South Korea",
}

function resolveName(name: string): string {
  const key = name.toLowerCase()
  return NAME_MAP[key] || name
}

export function getTeamInfo(team: string): TeamInfo | null {
  const resolved = resolveName(team)
  const match = Object.keys(TEAMS).find(
    (k) => k.toLowerCase() === resolved.toLowerCase() ||
      resolved.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(resolved.toLowerCase())
  )
  return match ? TEAMS[match] : null
}

export function getTitles(team: string): number {
  return getTeamInfo(team)?.titles ?? 0
}

export function getLastTitle(team: string): number | null {
  return getTeamInfo(team)?.lastTitle ?? null
}

export function isAfrican(team: string): boolean {
  const info = getTeamInfo(team)
  return info ? info.continent === "CAF" : false
}

export function isTraditional(team: string): boolean {
  const info = getTeamInfo(team)
  return info ? info.isTraditional : false
}

export function getBestResult(team: string): string {
  return getTeamInfo(team)?.bestResult ?? "Group stage"
}

export function getContinent(team: string): string | null {
  const info = getTeamInfo(team)
  return info ? info.continent : null
}

export function hasWonWorldCup(team: string): boolean {
  return (getTeamInfo(team)?.titles ?? 0) > 0
}

export function getLastFinalAppearance(team: string): number | null {
  for (const h of [...HISTORY].reverse()) {
    if (h.runnerUp.toLowerCase().includes(team.toLowerCase()) ||
        h.champion.toLowerCase().includes(team.toLowerCase())) {
      return h.year
    }
  }
  return null
}

export function getPreviousChampion(): string {
  const last = HISTORY[HISTORY.length - 1]
  return last?.champion ?? ""
}

export function getPreviousRunnerUp(): string {
  const last = HISTORY[HISTORY.length - 1]
  return last?.runnerUp ?? ""
}

export function getHistoryBefore(year: number): typeof HISTORY {
  return HISTORY.filter((h) => h.year < year)
}

export function getEdition(year: number) {
  return HISTORY.find((h) => h.year === year) || null
}

export function wasFinalInPreviousEdition(teamA: string, teamB: string): boolean {
  const last = HISTORY[HISTORY.length - 2]
  if (!last) return false
  const aMatch = teamA.toLowerCase().includes(last.champion.toLowerCase()) || last.champion.toLowerCase().includes(teamA.toLowerCase())
  const bMatch = teamB.toLowerCase().includes(last.runnerUp.toLowerCase()) || last.runnerUp.toLowerCase().includes(teamB.toLowerCase())
  const aMatch2 = teamA.toLowerCase().includes(last.runnerUp.toLowerCase()) || last.runnerUp.toLowerCase().includes(teamA.toLowerCase())
  const bMatch2 = teamB.toLowerCase().includes(last.champion.toLowerCase()) || last.champion.toLowerCase().includes(teamB.toLowerCase())
  return (aMatch && bMatch) || (aMatch2 && bMatch2)
}

export function wasInFinalConsecutively(team: string): boolean {
  const lastTwo = HISTORY.slice(-2)
  if (lastTwo.length < 2) return false
  const t = team.toLowerCase()
  const inBoth = lastTwo.every((h) =>
    h.champion.toLowerCase().includes(t) || h.runnerUp.toLowerCase().includes(t)
  )
  return inBoth
}

export function getPreviousFinalists(): { champion: string; runnerUp: string; year: number } | null {
  const last = HISTORY[HISTORY.length - 1]
  if (!last) return null
  return { champion: last.champion, runnerUp: last.runnerUp, year: last.year }
}

const POPULAR = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain", "uruguay",
]

export function isPopular(name: string): boolean {
  return POPULAR.some((t) => name.toLowerCase().includes(t))
}

export function getFifaRank(_team: string): number | null {
  const info = getTeamInfo(_team)
  if (!info) return null
  const ranks: Record<string, number> = {
    "Brazil": 1, "Belgium": 2, "Argentina": 3, "France": 4, "England": 5,
    "Italy": 6, "Spain": 7, "Netherlands": 8, "Portugal": 9, "Germany": 11,
    "Croatia": 12, "Mexico": 13, "Uruguay": 14, "Switzerland": 15, "USA": 16,
    "Senegal": 18, "Wales": 19, "Iran": 23, "Japan": 24, "Serbia": 25,
    "Poland": 26, "South Korea": 28, "Tunisia": 30, "Costa Rica": 32,
    "Nigeria": 35, "Cameroon": 38, "Canada": 41, "Ecuador": 44, "Saudi Arabia": 51,
  }
  return ranks[_team] ?? null
}
