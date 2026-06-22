const BASE_URL = "https://v3.football.api-sports.io"

const headers: Record<string, string> = {
  "x-rapidapi-key": process.env.API_FOOTBALL_KEY || "",
  "x-rapidapi-host": "v3.football.api-sports.io",
}

function apiKeyMissing(): boolean {
  return !process.env.API_FOOTBALL_KEY
}

async function fetchApi<T>(path: string): Promise<T | null> {
  if (apiKeyMissing()) return null
  try {
    const url = `${BASE_URL}${path}`
    const res = await fetch(url, { headers, next: { revalidate: 60 } })
    if (!res.ok) return null
    const json = await res.json()
    return json as T
  } catch {
    return null
  }
}

export interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
  }
  league: { round: string }
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null }
    away: { id: number; name: string; logo: string; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
    penalty?: { home: number | null; away: number | null }
  }
}

export interface ApiStandingEntry {
  rank: number
  team: { id: number; name: string; logo: string }
  points: number
  goalsDiff: string
  group: string
  form: string
  status: string
  description: string
}

interface ApiFixturesResponse {
  response: ApiFixture[]
}

interface ApiStandingsResponse {
  response: { league: { standings: ApiStandingEntry[][] } }[]
}

const COUNTRY_FLAGS: Record<string, string> = {
  Brazil: "🇧🇷", Spain: "🇪🇸", Argentina: "🇦🇷", Mexico: "🇲🇽",
  Germany: "🇩🇪", Japan: "🇯🇵", France: "🇫🇷", Portugal: "🇵🇹",
  Netherlands: "🇳🇱", Uruguay: "🇺🇾", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Italy: "🇮🇹", Croatia: "🇭🇷", Belgium: "🇧🇪", Switzerland: "🇨🇭",
  Poland: "🇵🇱", Senegal: "🇸🇳", Morocco: "🇲🇦", Ghana: "🇬🇭",
  Cameroon: "🇨🇲", Serbia: "🇷🇸", Korea: "🇰🇷", "South Korea": "🇰🇷",
  "Saudi Arabia": "🇸🇦", Australia: "🇦🇺", Canada: "🇨🇦",
  "Costa Rica": "🇨🇷", Ecuador: "🇪🇨", "United States": "🇺🇸",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", Iran: "🇮🇷", Tunisia: "🇹🇳",
  Denmark: "🇩🇰", Sweden: "🇸🇪", Norway: "🇳🇴",
}

export function getFlag(teamName: string): string {
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (teamName.toLowerCase().includes(key.toLowerCase())) return flag
  }
  return "🏳️"
}

export function getFixtureId(apiId: number): string {
  return `api-${apiId}`
}

export async function fetchFixturesByDate(date: string, leagueId?: string): Promise<ApiFixture[]> {
  const path = leagueId
    ? `/fixtures?date=${date}&league=${leagueId}&season=2026`
    : `/fixtures?date=${date}`
  const data = await fetchApi<ApiFixturesResponse>(path)
  return data?.response || []
}

export async function fetchLiveFixtures(): Promise<ApiFixture[]> {
  const data = await fetchApi<ApiFixturesResponse>("/fixtures?live=all")
  return data?.response || []
}

export async function fetchStandings(leagueId: string): Promise<ApiStandingEntry[]> {
  const data = await fetchApi<ApiStandingsResponse>(
    `/standings?league=${leagueId}&season=2026`
  )
  const league = data?.response?.[0]?.league
  if (!league) return []
  return league.standings[0] || []
}

export const LEAGUES = {
  WORLD_CUP: process.env.API_FOOTBALL_LEAGUE_ID || "1",
} as const
