import type { Match, Bulletin, BulletinItem } from "./types"
import type { ApiFixture, ApiStandingEntry } from "./api-football"
import { getFixtureId, getFlag } from "./api-football"

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
