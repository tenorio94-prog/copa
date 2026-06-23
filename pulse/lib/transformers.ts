import type { Match, Bulletin, BulletinItem } from "./types"
import type { ApiFixture, ApiStandingEntry } from "./api-football"
import type { FDMatch, FDStandingsGroup } from "./football-data"
import { getFixtureId, getFlag } from "./api-football"
import { getFlagByTla } from "./football-data"

const POPULAR_TEAMS = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain",
]

function isPopularTeam(name: string): boolean {
  return POPULAR_TEAMS.some((t) => name.toLowerCase().includes(t))
}

function calcImportanceScore(fixture: ApiFixture): number {
  let score = 0
  const round = fixture.league.round.toLowerCase()
  const home = fixture.teams.home.name
  const away = fixture.teams.away.name

  if (round.includes("final")) score += 40
  else if (round.includes("semi")) score += 35
  else if (round.includes("quarter")) score += 30
  else if (round.includes("round")) score += 25
  else if (round.includes("group")) score += 10

  if (isPopularTeam(home) || isPopularTeam(away)) score += 20

  const gh = fixture.goals.home
  const ga = fixture.goals.away
  if (gh !== null && ga !== null) {
    if (gh + ga >= 5) score += 15
  }

  if (fixture.score.halftime.home !== null && fixture.score.halftime.away !== null) {
    const htHome = fixture.score.halftime.home
    const htAway = fixture.score.halftime.away
    if (
      (gh !== null && ga !== null) &&
      ((htHome < htAway && gh > ga) || (htAway < htHome && ga > gh))
    ) {
      score += 15
    }
  }

  return Math.min(score, 100)
}

function mapStatus(short: string, elapsed: number | null): Match["status"] {
  if (short === "FT" || short === "AET" || short === "PEN") return "finished"
  if (short === "NS" || short === "TBD") return "scheduled"
  if (short === "LIVE" || short === "1H" || short === "2H" || short === "HT" || short === "ET" || short === "BT" || short === "P") return "live"
  return "scheduled"
}

function mapStage(round: string): string {
  const r = round.toLowerCase()
  if (r.includes("quarter")) return "Mata-mata"
  if (r.includes("round")) return "Mata-mata"
  if (r.includes("semi")) return "Semifinal"
  if (r.includes("final")) return "Final"
  if (r.includes("group")) return "Fase de grupos"
  return "Torneio"
}

function generateWhyItMatters(fixture: ApiFixture, score: number): string {
  const winner = fixture.teams.home.winner
    ? fixture.teams.home.name
    : fixture.teams.away.winner
      ? fixture.teams.away.name
      : null

  const isKnockout = score >= 25
  if (isKnockout && winner) {
    return `${winner} avança no torneio após vitória importante.`
  }
  if (isKnockout) {
    return `Jogo decisivo no mata-mata. Vencedor segue vivo na competição.`
  }
  if (isPopularTeam(fixture.teams.home.name) || isPopularTeam(fixture.teams.away.name)) {
    return `Jogo de um dos favoritos ao título. Resultado pode definir os rumos do grupo.`
  }
  return `Partida válida pela ${fixture.league.round}.`
}

export function toMatch(f: ApiFixture): Match {
  const status = mapStatus(f.fixture.status.short, f.fixture.status.elapsed)
  const score = calcImportanceScore(f)

  let penaltyScore: string | undefined
  if (f.score.penalty?.home != null && f.score.penalty?.away != null) {
    penaltyScore = `${f.score.penalty.home}-${f.score.penalty.away}`
  }

  return {
    id: getFixtureId(f.fixture.id),
    homeTeam: {
      id: String(f.teams.home.id),
      name: f.teams.home.name,
      code: f.teams.home.name.substring(0, 3).toUpperCase(),
      flag: getFlag(f.teams.home.name),
    },
    awayTeam: {
      id: String(f.teams.away.id),
      name: f.teams.away.name,
      code: f.teams.away.name.substring(0, 3).toUpperCase(),
      flag: getFlag(f.teams.away.name),
    },
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    penaltyScore,
    status,
    minute: f.fixture.status.elapsed ?? undefined,
    scheduledAt: f.fixture.date,
    round: f.league.round,
    stage: mapStage(f.league.round),
    importanceScore: score,
    whyItMatters: score > 20 ? generateWhyItMatters(f, score) : null,
  }
}

export function toBulletin(matches: Match[]): Bulletin {
  const today = new Date().toISOString().split("T")[0]
  const sorted = [...matches].sort((a, b) => b.importanceScore - a.importanceScore)
  const top = sorted[0]

  const items: BulletinItem[] = sorted
    .filter((m) => m.status === "finished" && m.importanceScore > 0)
    .map((m) => ({
      matchId: m.id,
      title: `${m.homeTeam.flag} ${m.homeTeam.name} ${m.homeScore ?? "?"}×${m.awayScore ?? "?"} ${m.awayTeam.name} ${m.awayTeam.flag}`,
      context: `${m.round} • ${m.stage}`,
      whyItMatters: m.whyItMatters ?? "Partida encerrada.",
      importanceScore: m.importanceScore,
    }))

  return {
    date: today,
    heroHeadline: top
      ? `${top.homeTeam.flag} ${top.homeTeam.name} ${top.homeScore ?? "–"}×${top.awayScore ?? "–"} ${top.awayTeam.name} ${top.awayTeam.flag}`
      : "Aguardando jogos da Copa",
    heroSummary: top?.whyItMatters ?? "Os primeiros jogos começam em breve.",
    heroImportanceScore: top?.importanceScore ?? 0,
    heroTag: top ? (top.stage === "Fase de grupos" ? "⚽ Fase de grupos" : "🏆 Mata-mata") : "📅 Em breve",
    items,
  }
}

export function toStandings(entries: ApiStandingEntry[]) {
  return entries.map((e) => ({
    pos: e.rank,
    flag: getFlag(e.team.name),
    name: e.team.name,
    pts: e.points,
    gd: e.goalsDiff,
  }))
}

export interface StandingsRow {
  pos: number
  flag: string
  name: string
  pts: number
  gd: string
}

export interface StandingsGroup {
  groupName: string
  rows: StandingsRow[]
}

function mapStageFD(stage: string): string {
  if (stage === "FINAL") return "Final"
  if (stage === "THIRD_PLACE") return "Disputa de 3º lugar"
  if (stage === "SEMI_FINALS") return "Semifinal"
  if (stage === "QUARTER_FINALS") return "Quartas de final"
  if (stage === "LAST_16" || stage === "LAST_32" || stage === "LAST_64") return "Mata-mata"
  if (stage === "GROUP_STAGE") return "Fase de grupos"
  if (stage === "PRELIMINARY_ROUND") return "Pré-Copa"
  return "Torneio"
}

function mapStatusFD(status: string): Match["status"] {
  if (status === "FINISHED" || status === "AWARDED") return "finished"
  if (status === "IN_PLAY" || status === "PAUSED" || status === "LIVE") return "live"
  return "scheduled"
}

function mapScoreFD(score: FDMatch["score"]): { home: number | null; away: number | null; penaltyScore?: string } {
  let penaltyScore: string | undefined
  if (score.penalties?.home != null && score.penalties?.away != null) {
    penaltyScore = `${score.penalties.home}-${score.penalties.away}`
  }
  return {
    home: score.fullTime.home,
    away: score.fullTime.away,
    penaltyScore,
  }
}

function calcImportanceScoreFD(m: FDMatch): number {
  let s = 0
  const st = m.stage
  if (st === "FINAL") s += 40
  else if (st === "SEMI_FINALS") s += 35
  else if (st === "QUARTER_FINALS") s += 30
  else if (st === "LAST_16" || st === "LAST_32" || st === "LAST_64") s += 25
  else if (st === "GROUP_STAGE") s += 10

  const POPULAR_TLAS = ["BRA", "ARG", "GER", "FRA", "ENG", "ITA", "NED", "POR", "ESP"]
  if (POPULAR_TLAS.includes(m.homeTeam.tla) || POPULAR_TLAS.includes(m.awayTeam.tla)) s += 20

  const gh = m.score.fullTime.home
  const ga = m.score.fullTime.away
  if (gh !== null && ga !== null && gh + ga >= 5) s += 15

  if (m.score.halfTime.home !== null && m.score.halfTime.away !== null) {
    const htHome = m.score.halfTime.home
    const htAway = m.score.halfTime.away
    if (gh !== null && ga !== null && ((htHome < htAway && gh > ga) || (htAway < htHome && ga > gh))) s += 15
  }

  return Math.min(s, 100)
}

function mapTLA(tla: string | undefined): string {
  return (tla || "???").toUpperCase()
}

export function fromFDMatch(m: FDMatch): Match {
  const status = mapStatusFD(m.status)
  const score = mapScoreFD(m.score)
  const importance = calcImportanceScoreFD(m)

  return {
    id: `fd-${m.id}`,
    homeTeam: {
      id: String(m.homeTeam.id),
      name: m.homeTeam.name,
      code: mapTLA(m.homeTeam.tla),
      flag: getFlagByTla(m.homeTeam.tla || ""),
    },
    awayTeam: {
      id: String(m.awayTeam.id),
      name: m.awayTeam.name,
      code: mapTLA(m.awayTeam.tla),
      flag: getFlagByTla(m.awayTeam.tla || ""),
    },
    homeScore: score.home,
    awayScore: score.away,
    penaltyScore: score.penaltyScore,
    status,
    minute: status === "live" ? undefined : undefined,
    scheduledAt: m.utcDate,
    round: m.group ? `${mapStageFD(m.stage)} • ${m.group.replace("Group ", "Grupo ")}` : mapStageFD(m.stage),
    stage: mapStageFD(m.stage),
    importanceScore: importance,
    whyItMatters: importance >= 50
      ? `${m.homeTeam.name} vs ${m.awayTeam.name}. Jogo decisivo: o vencedor dá passo forte rumo à classificação.`
      : importance >= 20
        ? `${m.homeTeam.name} vs ${m.awayTeam.name}. Resultado impacta classificação do ${m.group?.replace("Group ", "Grupo ") || "grupo"}.`
        : `${m.homeTeam.name} vs ${m.awayTeam.name}. Primeira rodada do ${m.group?.replace("Group ", "Grupo ") || "grupo"}.`,
  }
}

export function fromFDStandingsGroups(groups: FDStandingsGroup[]): StandingsGroup[] {
  return groups.map((g) => ({
    groupName: g.group,
    rows: g.table.map((e) => ({
      pos: e.position,
      flag: getFlagByTla(e.team.tla || ""),
      name: e.team.name,
      pts: e.points,
      gd: e.goalDifference > 0 ? `+${e.goalDifference}` : String(e.goalDifference),
    })),
  }))
}
