let COMPETITION_CODE = process.env.FOOTBALL_DATA_COMPETITION || "WC"
const SEASON = process.env.FOOTBALL_DATA_SEASON || "2026"

export interface FDCompetition {
  id: number
  name: string
  code: string
  type: string
  plan: string
}

export interface FDMatch {
  id: number
  status: "TIMED" | "SCHEDULED" | "LIVE" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "SUSPENDED" | "CANCELLED"
  matchday: number
  stage: "GROUP_STAGE" | "LAST_64" | "LAST_32" | "LAST_16" | "QUARTER_FINALS" | "SEMI_FINALS" | "FINAL" | "THIRD_PLACE" | "PRELIMINARY_ROUND"
  group: string | null
  utcDate: string
  homeTeam: { id: number; name: string; tla: string; crest: string }
  awayTeam: { id: number; name: string; tla: string; crest: string }
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
    penalties?: { home: number | null; away: number | null }
  }
  season: { currentMatchday: number }
}

export interface FDStandingEntry {
  position: number
  team: { id: number; name: string; tla: string; crest: string }
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  group: string
  form: string | null
}

export interface FDStandingsGroup {
  stage: string
  type: string
  group: string
  table: FDStandingEntry[]
}

interface FDMatchesResponse {
  matches: FDMatch[]
}

interface FDCompetitionsResponse {
  competitions: FDCompetition[]
}

interface FDStandingsResponse {
  competition: { id: number; name: string; code: string }
  standings: FDStandingsGroup[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchApi<T>(path: string, revalidateSec = 60): Promise<T | null> {
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) return null
  const base = process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4"
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { "X-Auth-Token": key },
      next: { revalidate: revalidateSec },
    })
    if (res.status === 429) {
      console.warn("[football-data] rate limit (429)")
      await sleep(1000)
      return null
    }
    if (!res.ok) {
      console.error(`[football-data] ${res.status} for ${path}`)
      return null
    }
    return (await res.json()) as T
  } catch (err) {
    console.error("[football-data]", err)
    return null
  }
}

export async function probeCompetition(): Promise<{ code: string; id: number } | null> {
  const data = await fetchApi<FDCompetitionsResponse>("/competitions", 3600)
  if (!data?.competitions) return null
  const wcs = data.competitions.filter((c) =>
    c.name.toLowerCase().includes("world cup")
  )
  if (wcs.length === 0) {
    console.log("[football-data] no World Cup competition found in free tier")
    return null
  }
  for (const c of wcs) {
    console.log(`[football-data] found: name="${c.name}" code="${c.code}" id=${c.id} plan=${c.plan}`)
  }
  const best = wcs.find((c) => c.code === "WC") || wcs[0]
  COMPETITION_CODE = best.code
  return { code: best.code, id: best.id }
}

export async function fetchTodaysFixtures(): Promise<{ items: FDMatch[]; currentMatchday: number }> {
  const today = new Date().toISOString().split("T")[0]
  const data = await fetchApi<FDMatchesResponse>(
    `/competitions/${COMPETITION_CODE}/matches?dateFrom=${today}&dateTo=${today}`,
    120
  )
  if (!data) return { items: [], currentMatchday: 1 }
  const matchday = data.matches[0]?.season?.currentMatchday ?? 1
  return { items: data.matches ?? [], currentMatchday: matchday }
}

export async function fetchFixturesByDate(date: string): Promise<{ items: FDMatch[]; currentMatchday: number }> {
  const data = await fetchApi<FDMatchesResponse>(
    `/competitions/${COMPETITION_CODE}/matches?dateFrom=${date}&dateTo=${date}`,
    3600
  )
  if (!data) return { items: [], currentMatchday: 1 }
  const matchday = data.matches[0]?.season?.currentMatchday ?? 1
  return { items: data.matches ?? [], currentMatchday: matchday }
}

export async function fetchUpcoming(limit = 3): Promise<{ items: FDMatch[]; currentMatchday: number }> {
  const today = new Date()
  const future = new Date(today)
  future.setDate(future.getDate() + 30)
  const from = today.toISOString().split("T")[0]
  const to = future.toISOString().split("T")[0]
  const data = await fetchApi<FDMatchesResponse>(
    `/competitions/${COMPETITION_CODE}/matches?dateFrom=${from}&dateTo=${to}`,
    300
  )
  if (!data) return { items: [], currentMatchday: 1 }
  const now = today.toISOString()
  const upcoming = (data.matches ?? [])
    .filter((m) => (m.status === "TIMED" || m.status === "SCHEDULED") && m.utcDate > now)
    .slice(0, limit)
  const matchday = data.matches[0]?.season?.currentMatchday ?? 1
  return { items: upcoming, currentMatchday: matchday }
}

export async function fetchLiveFixtures(): Promise<FDMatch[]> {
  const data = await fetchApi<FDMatchesResponse>(
    `/competitions/${COMPETITION_CODE}/matches?status=LIVE`,
    30
  )
  return data?.matches ?? []
}

export async function fetchStandings(): Promise<FDStandingsGroup[]> {
  const data = await fetchApi<FDStandingsResponse>(
    `/competitions/${COMPETITION_CODE}/standings?season=${SEASON}`,
    300
  )
  if (!data?.standings) return []
  return data.standings.filter((s) => s.type === "TOTAL" && s.group)
}

const FLAGS_BY_TLA: Record<string, string> = {
  BRA: "🇧🇷", ARG: "🇦🇷", FRA: "🇫🇷", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", ESP: "🇪🇸",
  GER: "🇩🇪", ITA: "🇮🇹", POR: "🇵🇹", NED: "🇳🇱", URU: "🇺🇾",
  MEX: "🇲🇽", JPN: "🇯🇵", KOR: "🇰🇷", USA: "🇺🇸", CAN: "🇨🇦",
  MAR: "🇲🇦", SEN: "🇸🇳", GHA: "🇬🇭", CMR: "🇨🇲", TUN: "🇹🇳",
  CRO: "🇭🇷", BEL: "🇧🇪", SUI: "🇨🇭", POL: "🇵🇱", SRB: "🇷🇸",
  AUS: "🇦🇺", ECU: "🇪🇨", IRN: "🇮🇷", KSA: "🇸🇦", WAL: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  DEN: "🇩🇰", SWE: "🇸🇪", NOR: "🇳🇴", HUN: "🇭🇺", RUS: "🇷🇺",
  COL: "🇨🇴", CHI: "🇨🇱", PAR: "🇵🇾", PER: "🇵🇪", NGA: "🇳🇬",
  EGY: "🇪🇬", CIV: "🇨🇮", ALG: "🇩🇿", UKR: "🇺🇦", TUR: "🇹🇷",
  CZE: "🇨🇿", AUT: "🇦🇹", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  RSA: "🇿🇦", NZL: "🇳🇿", HAI: "🇭🇹", BIH: "🇧🇦", PAN: "🇵🇦",
  CPV: "🇨🇻", COD: "🇨🇩", QAT: "🇶🇦", JOR: "🇯🇴", IRQ: "🇮🇶",
  UZB: "🇺🇿", CUW: "🇨🇼",
}

const FLAGS_BY_NAME: Record<string, string> = {
  "Uzbekistan": "🇺🇿",
  "Panama": "🇵🇦",
  "Jordan": "🇯🇴",
  "Algeria": "🇩🇿",
  "Cape Verde Islands": "🇨🇻",
  "Curaçao": "🇨🇼",
  "Congo DR": "🇨🇩",
  "Bosnia-Herzegovina": "🇧🇦",
  "South Africa": "🇿🇦",
  "New Zealand": "🇳🇿",
  "Haiti": "🇭🇹",
  "Czechia": "🇨🇿",
  "Iraq": "🇮🇶",
}

export function getFlagByTla(tla: string): string {
  return FLAGS_BY_TLA[tla.toUpperCase()] ?? "🏳️"
}

export function getFlagByName(name: string): string {
  return FLAGS_BY_NAME[name] ?? getFlagByTla(name.substring(0, 3).toUpperCase()) ?? "🏳️"
}

export function deriveCurrentStage(todayFixtures: FDMatch[], upcoming: FDMatch[]): string {
  const all = [...todayFixtures, ...upcoming]
  for (const m of all) {
    const stage = m.stage
    if (stage === "FINAL") return "Final"
    if (stage === "THIRD_PLACE") return "Disputa de 3º lugar"
    if (stage === "SEMI_FINALS") return "Semifinais"
    if (stage === "QUARTER_FINALS") return "Quartas de final"
    if (stage === "LAST_16" || stage === "LAST_32" || stage === "LAST_64") return "Mata-mata"
  }
  if (all.length > 0) return "Fase de grupos"
  return "Copa do Mundo"
}

export function isKeyConfigured(): boolean {
  return !!process.env.FOOTBALL_DATA_API_KEY
}

export function getCompetitionCode(): string {
  return COMPETITION_CODE
}
