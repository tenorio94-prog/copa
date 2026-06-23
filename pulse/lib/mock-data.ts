import type { Match, Bulletin, BulletinItem, EditorialStory, StoryBrief, NextChapter, ActiveNarrative } from "./types"
import {
  fetchFixturesByDate,
  fetchLiveFixtures,
  fetchStandings,
  LEAGUES,
} from "./api-football"
import {
  fetchTodaysFixtures,
  fetchUpcoming,
  fetchStandings as fdFetchStandings,
  deriveCurrentStage,
  isKeyConfigured,
} from "./football-data"
import type { FDMatch } from "./football-data"
import { toMatch, toStandings, fromFDMatch, fromFDStandingsGroups } from "./transformers"
import type { StandingsGroup, StandingsRow } from "./transformers"
import type { FDStandingsGroup as FDStandingsGroupType } from "./football-data"

export interface DashboardData {
  matches: Match[]
  bulletin: Bulletin
  stories: EditorialStory[]
  brief: StoryBrief
  nextChapter: NextChapter | null
  activeNarratives: ActiveNarrative[]
  standings: StandingsRow[]
  standingsGroupName?: string
}
import { enrichMatches } from "./context-builder"
import { generateBulletinContent } from "./llm"
import { buildMemory } from "./tournament-memory"
import { buildHistoricalFacts } from "./historical-context-builder"
import { selectStories, getHeroStory } from "./editorial-story-engine"
import { buildBrief } from "./story-brief"
import { buildNextChapter } from "./next-chapter"
import { buildNarratives, buildGroupSummary } from "./narrative-tracker"
import { templateHeadline, templateSummary, templateWhyItMatters, templateTag } from "./templates"

const today = new Date().toISOString().split("T")[0]

export async function fetchDashboardData(targetDay: number = 0): Promise<DashboardData> {
  const dataSource = process.env.DATA_SOURCE || "auto"
  const useReal = dataSource !== "mock" && isKeyConfigured()

  if (!useReal) {
    console.info("[real-data] using mock data source (DATA_SOURCE=mock or no key)")
    return mockDashboardData()
  }

  try {
    // NOTE: probeCompetition() was removed from the hot path to avoid
    // burning the free-tier rate quota (10 req/min). "WC" is the default
    // competition code and works on football-data.org free tier.
    // The probe is only useful as a one-time diagnostic via scripts/probe-fd.mjs.

    const WC_START = new Date("2026-06-11")
    const todayDate = new Date()
    const currentDay = Math.floor((todayDate.getTime() - WC_START.getTime()) / 86400000) + 1

    let dateForFixtures = new Date()
    if (targetDay > 0) {
      const offset = targetDay - currentDay
      const targetDate = new Date(todayDate.getTime() + offset * 86400000)
      dateForFixtures = targetDate
    }
    const dateStr = dateForFixtures.toISOString().split("T")[0]
    const { fetchFixturesByDate } = await import("./football-data")

    const [todayResult, upcomingResult, fdStandings] = await Promise.all([
      targetDay > 0 ? fetchFixturesByDate(dateStr) : fetchTodaysFixtures(),
      fetchUpcoming(3),
      fdFetchStandings(),
    ])

    const apiMatches = todayResult.items
    // Extract live fixtures from the already-fetched today's fixtures.
    // This avoids a separate `/matches?status=LIVE` call (saves 1 req/page view).
    const liveFixtures = apiMatches.filter(
      (f) => f.status === "LIVE" || f.status === "IN_PLAY" || f.status === "PAUSED"
    )

    const seen = new Set<number>()
    const unique = [...apiMatches, ...liveFixtures].filter((f) => {
      if (seen.has(f.id)) return false
      seen.add(f.id)
      return true
    })

    if (unique.length === 0) {
      return dashboardWithNoGamesToday(upcomingResult.items, fdStandings, targetDay)
    }

    return buildDashboardFromFixtures(
      unique,
      upcomingResult.items,
      fdStandings,
      todayResult.currentMatchday,
      targetDay
    )
  } catch (err) {
    console.error("[real-data]", err)
    return null as unknown as DashboardData
  }
}

function buildDashboardFromFixtures(
  fixtures: FDMatch[],
  upcoming: FDMatch[],
  fdStandings: FDStandingsGroupType[],
  currentMatchday: number = 1,
  targetDay: number = 0
): DashboardData {
  const matches = fixtures.map(fromFDMatch)
  const eligibleForStory = matches.filter(m => {
    if (m.status === "finished") return true
    if (m.status === "live") {
      const hasScore = m.homeScore !== null && m.awayScore !== null && (m.homeScore > 0 || m.awayScore > 0)
      return hasScore
    }
    return false
  })
  const enriched = enrichMatches(eligibleForStory, matches)
  const memory = buildMemory(matches)
  const enrichedWithFacts = enriched.map((e) => ({
    ...e,
    historicalFacts: buildHistoricalFacts(e, memory),
  }))
  memory.historicalFacts = enrichedWithFacts.flatMap((e) => e.historicalFacts)

  const memoryWithArcs = buildMemory(matches)
  memoryWithArcs.historicalFacts = memory.historicalFacts
  const stories = selectStories(enriched, memoryWithArcs, matches)

  const currentStage = deriveCurrentStage(fixtures, upcoming)

  const wcStart = new Date("2026-06-11")
  const todayDate = new Date()
  const dayDiff = Math.floor((todayDate.getTime() - wcStart.getTime()) / 86400000) + 1
  const computedDay = Math.max(1, dayDiff)


  const upcomingLabel = upcoming[0]
    ? `${upcoming[0].homeTeam.name} vs ${upcoming[0].awayTeam.name}`
    : undefined
  const todayLabel = matches.length > 0
    ? `${matches[0].homeTeam.name} ${matches[0].homeScore ?? ""}×${matches[0].awayScore ?? ""} ${matches[0].awayTeam.name}`
    : "Nenhum jogo hoje"

  const brief = buildBrief(stories, memory, {
    currentStage,
    currentMatchday: targetDay > 0 ? targetDay : computedDay,
    matchesTodayCount: fixtures.length,
    upcomingLabel: targetDay > 0 ? undefined : upcomingLabel,
    todayLabel,
  })
  const nextChapter = buildNextChapter(brief, memoryWithArcs.narrativeArcs, memory)
  let activeNarratives = buildNarratives(memoryWithArcs.narrativeArcs, memory)
  if (activeNarratives.length === 0) {
    activeNarratives = buildGroupSummary(memory)
  }

  const standingsGroups = fromFDStandingsGroups(fdStandings)
  const { group: selectedGroup, standings: flatStandings } = pickBestGroup(standingsGroups)
  const resultStandings = flatStandings.length > 0 ? flatStandings : []

  return {
    matches,
    bulletin: buildBulletin(stories),
    stories,
    brief,
    nextChapter,
    activeNarratives,
    standings: resultStandings,
    standingsGroupName: selectedGroup,
  }
}

function dashboardWithNoGamesToday(
  upcoming: FDMatch[],
  fdStandings: FDStandingsGroupType[],
  targetDay: number = 0
): DashboardData {
  const upcomingMatches = upcoming.map(fromFDMatch)

  let headline = "Nenhum jogo hoje"
  let bullets: [string, string, string] = [
    "📅 Nenhuma partida programada para hoje",
    "🏆 A Copa continua em breve",
    "⚽ Aguarde os próximos jogos",
  ]

  if (upcomingMatches.length > 0) {
    const next = upcomingMatches[0]
    const nextDate = new Date(next.scheduledAt)
    const dateStr = nextDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
    headline = `Próximo: ${next.homeTeam.name} vs ${next.awayTeam.name}`
    bullets = upcomingMatches.slice(0, 3).map((m, i) => {
      const d = new Date(m.scheduledAt)
      const ds = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
      return `${i === 0 ? "⚽" : "📅"} ${ds} • ${m.homeTeam.flag} ${m.homeTeam.name} vs ${m.awayTeam.name} ${m.awayTeam.flag} — ${m.stage}`
    }) as [string, string, string]
  }

  const standingsGroups = fromFDStandingsGroups(fdStandings)
  const { group: selectedGroup, standings: flatStandings } = pickBestGroup(standingsGroups)

  const brief: StoryBrief = {
    id: `brief-${today}`,
    date: today,
    headline,
    bullets,
    continuity: {
      day: targetDay > 0 ? targetDay : 0,
      phase: "Copa do Mundo",
      phaseProgress: "Copa do Mundo",
      matchCount: 0,
      yesterday: "—",
      today: "Nenhum jogo hoje",
    },
    storyType: "historical",
    tag: "📅 Copa",
    confidence: 0,
    readingTime: 15,
    shareText: null,
    audioAvailable: false,
  }

  return {
    matches: upcomingMatches,
    bulletin: {
      date: today,
      heroHeadline: headline,
      heroSummary: upcomingMatches.length > 0 ? `Próximo jogo: ${upcomingMatches[0].homeTeam.name} vs ${upcomingMatches[0].awayTeam.name}` : "Aguardando jogos da Copa",
      heroImportanceScore: 0,
      heroTag: "📅 Em breve",
      items: [],
    },
    stories: [],
    brief,
    nextChapter: null,
    activeNarratives: [],
    standings: flatStandings,
    standingsGroupName: selectedGroup,
  }
}

function buildBulletin(stories: EditorialStory[]): Bulletin {
  const sorted = [...stories].sort((a, b) => a.priority - b.priority)
  const hero = sorted[0]

  return {
    date: today,
    heroHeadline: hero?.headline ?? "Aguardando jogos da Copa",
    heroSummary: hero?.whyItMatters ?? "",
    heroImportanceScore: hero ? Math.round(hero.confidence * 100) : 0,
    heroTag: hero?.tag ?? "📅 Copa",
    items: sorted.slice(0, 3).map((s) => ({
      matchId: s.matchId,
      title: s.headline,
      context: s.evidence.slice(0, 2).join(" • "),
      whyItMatters: s.whyItMatters,
      importanceScore: Math.round(s.confidence * 100),
    })),
  }
}

function pickBestGroup(groups: StandingsGroup[]): { group: string; standings: StandingsRow[] } {
  if (groups.length === 0) return { group: "Grupo A", standings: [] }

  const TRADITIONAL = ["brazil", "argentina", "germany", "france", "england", "italy", "netherlands", "portugal", "spain", "uruguay"]

  let bestGroup = groups[0]
  let bestScore = 0

  for (const g of groups) {
    const score = g.rows.filter((r) =>
      TRADITIONAL.some((t) => r.name.toLowerCase().includes(t))
    ).length
    if (score > bestScore) {
      bestScore = score
      bestGroup = g
    }
  }

  return {
    group: bestGroup.groupName.replace("Group ", "Grupo "),
    standings: bestGroup.rows,
  }
}

async function mockDashboardData(): Promise<DashboardData> {
  const [dateFixtures, liveFixtures, standingsData] = await Promise.all([
    fetchFixturesByDate(today, LEAGUES.WORLD_CUP),
    fetchLiveFixtures(),
    fetchStandings(LEAGUES.WORLD_CUP),
  ])

  const apiMatches = [...dateFixtures, ...liveFixtures]
  const seen = new Set<number>()
  const unique = apiMatches.filter((f) => {
    if (seen.has(f.fixture.id)) return false
    seen.add(f.fixture.id)
    return true
  })

  if (unique.length === 0) {
    return fallbackDashboard()
  }

  const matches = unique.map(toMatch)
  const enriched = enrichMatches(matches.filter(m => m.status === "finished"), matches)
  const memory = buildMemory(matches)
  const enrichedWithFacts = enriched.map((e) => ({
    ...e,
    historicalFacts: buildHistoricalFacts(e, memory),
  }))
  memory.historicalFacts = enrichedWithFacts.flatMap((e) => e.historicalFacts)

  const memoryWithArcs = buildMemory(matches)
  memoryWithArcs.historicalFacts = memory.historicalFacts
  const stories = selectStories(enriched, memoryWithArcs)

  const llmContent = await generateBulletinContent(enrichedWithFacts, memory)

  let headline: string
  let summary: string
  if (llmContent) {
    headline = llmContent.headline
    summary = llmContent.summary
  } else {
    headline = templateHeadline(enriched)
    summary = templateSummary(enriched)
  }

  const hero = getHeroStory(stories)
  const bulletin: Bulletin = {
    date: today,
    heroHeadline: hero?.headline ?? headline,
    heroSummary: hero?.whyItMatters ?? summary,
    heroImportanceScore: hero ? Math.round(hero.confidence * 100) : 0,
    heroTag: hero?.tag ?? "📅 Copa",
    items: stories.slice(0, 3).map((s) => ({
      matchId: s.matchId,
      title: s.headline,
      context: s.evidence.slice(0, 2).join(" • "),
      whyItMatters: s.whyItMatters,
      importanceScore: Math.round(s.confidence * 100),
    })),
  }

  const flatStandings = toStandings(standingsData)
  const brief = buildBrief(stories, memory)
  const nextChapter = buildNextChapter(brief, memoryWithArcs.narrativeArcs, memory)
  let activeNarratives = buildNarratives(memoryWithArcs.narrativeArcs, memory)
  if (activeNarratives.length === 0) {
    activeNarratives = buildGroupSummary(memory)
  }

  return {
    matches,
    bulletin,
    stories,
    brief,
    nextChapter,
    activeNarratives,
    standings: flatStandings.length > 0 ? flatStandings : [],
  }
}

function fallbackDashboard(): DashboardData {
  const todayStr = new Date().toISOString().split("T")[0]

  const fallbackMatches: Match[] = [
    {
      id: "1",
      homeTeam: { id: "arg", name: "Argentina", code: "ARG", flag: "🇦🇷" },
      awayTeam: { id: "cro", name: "Croácia", code: "CRO", flag: "🇭🇷" },
      homeScore: 3, awayScore: 0, status: "finished",
      scheduledAt: `${todayStr}T16:00:00Z`,
      round: "Semifinal", stage: "Semifinal",
      importanceScore: 95,
      whyItMatters: "Argentina vai à final. Messi busca o título que faltava contra a França.",
    },
    {
      id: "2",
      homeTeam: { id: "fra", name: "França", code: "FRA", flag: "🇫🇷" },
      awayTeam: { id: "mor", name: "Marrocos", code: "MAR", flag: "🇲🇦" },
      homeScore: 2, awayScore: 0, status: "finished",
      scheduledAt: `${todayStr}T13:00:00Z`,
      round: "Semifinal", stage: "Semifinal",
      importanceScore: 88,
      whyItMatters: "França chega à segunda final consecutiva. Marrocos faz história como primeiro africano na semi.",
    },
    {
      id: "3",
      homeTeam: { id: "fra", name: "França", code: "FRA", flag: "🇫🇷" },
      awayTeam: { id: "arg", name: "Argentina", code: "ARG", flag: "🇦🇷" },
      homeScore: null, awayScore: null, status: "scheduled",
      scheduledAt: `${todayStr}T12:00:00Z`,
      round: "Final", stage: "Final",
      importanceScore: 100,
      whyItMatters: "A final da Copa: França busca o bi. Argentina tenta encerrar jejum de 36 anos.",
    },
  ]

  const fallbackBulletin: Bulletin = {
    date: todayStr,
    heroHeadline: "Argentina vence Croácia e vai à final contra a França",
    heroSummary: "Messi brilha na semifinal. Argentina busca encerrar jejum de 36 anos contra a atual campeã.",
    heroImportanceScore: 95,
    heroTag: "🔥 Redenção",
    items: [
      { matchId: "1", title: "🇦🇷 Argentina 3×0 Croácia", context: "Semifinal • Messi decide", whyItMatters: "Argentina vai à final e tenta quebrar jejum de 36 anos", importanceScore: 95 },
      { matchId: "2", title: "🇫🇷 França 2×0 Marrocos", context: "Semifinal • Atual campeã segue viva", whyItMatters: "França chega à segunda final consecutiva. Marrocos faz história.", importanceScore: 88 },
    ],
  }

  const fallbackStories: EditorialStory[] = [
    {
      id: "story-1",
      headline: "Argentina vence Croácia e vai à final buscar o tri",
      storyType: "redemption",
      confidence: 0.97,
      evidence: [
        "Argentina está na final após 36 anos sem título",
        "Messi lidera o time em sua última Copa",
        "Argentina perdeu na estreia e se recuperou até a final",
      ],
      narrativeHook: "A história mais improvável da Copa continua sendo escrita.",
      whyItMatters: "Argentina pode encerrar um jejum de 36 anos. Messi busca o título que faltava.",
      priority: 1,
      matchId: "1",
      tag: "🔥 Redenção",
    },
    {
      id: "story-2",
      headline: "França elimina Marrocos e chega à segunda final consecutiva",
      storyType: "milestone",
      confidence: 0.91,
      evidence: [
        "França é a primeira a chegar a duas finais consecutivas desde 1998",
        "Marrocos faz história como primeiro africano na semifinal",
      ],
      narrativeHook: "O que parecia impossível há quatro anos, hoje é realidade.",
      whyItMatters: "França busca o bicampeonato. Marrocos quebrou barreiras para o futebol africano.",
      priority: 2,
      matchId: "2",
      tag: "📜 Marco histórico",
    },
    {
      id: "story-3",
      headline: "Final: Argentina vs França — Messi busca o título que faltava",
      storyType: "historical",
      confidence: 0.85,
      evidence: ["A final mais esperada da década", "Messi vs Mbappé decidem o título"],
      narrativeHook: "O maior jogador da história contra a atual campeã mundial.",
      whyItMatters: "Amanhã: Argentina e França decidem a Copa. Messi tenta completar seu legado.",
      priority: 3,
      matchId: "3",
      tag: "🏆 Final",
    },
  ]

  const fallbackBrief: StoryBrief = {
    id: "brief-fallback",
    date: todayStr,
    headline: "Argentina vence Croácia e vai à final contra a França",
    bullets: [
      "🔥 Argentina 3×0 Croácia — Messi decide. Argentina vai à final após 36 anos.",
      "📰 França 2×0 Marrocos — Atual campeã chega à segunda final consecutiva. Marrocos faz história.",
      "⚽ Amanhã: Final — Argentina vs França. Messi busca o título que faltava.",
    ],
    continuity: {
      day: 28,
      phase: "Final",
      phaseProgress: "Final",
      matchCount: 2,
      yesterday: "Argentina: Eliminou Croácia",
      today: "Final: Argentina vs França",
    },
    storyType: "redemption",
    tag: "🔥 Redenção",
    confidence: 0.97,
    readingTime: 15,
    shareText: "🔥 Argentina vai à final contra a França. Messi busca o título que faltava. copapulse.vercel.app",
    audioAvailable: false,
  }

  const fallbackNextChapter: NextChapter = {
    id: "next-fallback",
    narrativeType: "redemption_journey",
    headline: "Argentina busca encerrar jejum de 36 anos contra a França na grande final",
    hook: "Argentina perdeu na estreia, se reconstruiu e agora está a um jogo do título. Do outro lado, a França tenta o bicampeonato.",
    openQuestion: "Messi finalmente conquista o título que faltava? Ou a França confirma a dinastia?",
    nextEvent: { label: "Argentina vs França", date: "Amanhã, 12:00", stage: "Final" },
    teams: ["Argentina", "França"],
    confidence: 0.97,
    hasOpenQuestion: true,
  }

  const fallbackNarratives: ActiveNarrative[] = [
    {
      id: "nar-argentina-redemption",
      title: "Argentina: Jornada de redenção",
      narrativeType: "redemption_journey",
      team: "Argentina",
      currentChapter: 6,
      totalChaptersKnown: 7,
      status: "active",
      nextChapter: "Buscar o título que completa a redenção",
      importance: 97,
      journey: ["Perdeu para Arábia Saudita", "Venceu México", "Eliminou Holanda nos pênaltis", "Eliminou Croácia"],
    },
    {
      id: "nar-marrocos-cinderella",
      title: "Marrocos: Campanha histórica",
      narrativeType: "cinderella_progression",
      team: "Marrocos",
      currentChapter: 6,
      totalChaptersKnown: 6,
      status: "completed",
      nextChapter: "Primeiro africano na semifinal — missão cumprida",
      importance: 92,
      journey: ["Venceu Bélgica", "Eliminou Espanha nos pênaltis", "Eliminou Portugal", "Eliminado pela França na semi"],
    },
    {
      id: "nar-franca-dynasty",
      title: "França: Dinastia",
      narrativeType: "giant_slayer",
      team: "França",
      currentChapter: 4,
      totalChaptersKnown: 5,
      status: "active",
      nextChapter: "Buscar o bicampeonato na final",
      importance: 85,
      journey: ["Eliminou Inglaterra", "Eliminou Marrocos"],
    },
  ]

  const fallbackStandings = [
    { pos: 1, flag: "🇦🇷", name: "Argentina", pts: 4, gd: "+2" },
    { pos: 2, flag: "🇲🇽", name: "México", pts: 2, gd: "0" },
    { pos: 3, flag: "🇵🇱", name: "Polônia", pts: 1, gd: "-1" },
    { pos: 4, flag: "🇸🇦", name: "Arábia Saudita", pts: 1, gd: "-1" },
  ]

  return {
    matches: fallbackMatches,
    bulletin: fallbackBulletin,
    stories: fallbackStories,
    brief: fallbackBrief,
    nextChapter: fallbackNextChapter,
    activeNarratives: fallbackNarratives,
    standings: fallbackStandings,
  }
}
