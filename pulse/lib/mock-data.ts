import type { Match, Bulletin, BulletinItem, EditorialStory, StoryBrief, NextChapter, ActiveNarrative } from "./types"
import {
  fetchFixturesByDate,
  fetchLiveFixtures,
  fetchStandings,
  LEAGUES,
} from "./api-football"
import { toMatch, toStandings } from "./transformers"
import { enrichMatches } from "./context-builder"
import { generateBulletinContent } from "./llm"
import { buildMemory } from "./tournament-memory"
import { buildHistoricalFacts } from "./historical-context-builder"
import { selectStories, getHeroStory, getSecondaryStory } from "./editorial-story-engine"
import { buildBrief } from "./story-brief"
import { buildNextChapter } from "./next-chapter"
import { buildNarratives } from "./narrative-tracker"
import { templateHeadline, templateSummary, templateWhyItMatters, templateTag } from "./templates"

const today = new Date().toISOString().split("T")[0]

export async function fetchDashboardData(): Promise<{
  matches: Match[]
  bulletin: Bulletin
  stories: EditorialStory[]
  brief: StoryBrief
  nextChapter: NextChapter | null
  activeNarratives: ActiveNarrative[]
  standings: { pos: number; flag: string; name: string; pts: number; gd: string }[]
}> {
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
    return { matches: fallbackMatches, bulletin: fallbackBulletin, stories: fallbackStories, brief: fallbackBrief, nextChapter: fallbackNextChapter, activeNarratives: fallbackNarratives, standings: fallbackStandings }
  }

  const matches = unique.map(toMatch)
  const enriched = enrichMatches(matches.filter(m => m.status === "finished"), matches)
  const memory = buildMemory(matches)
  const enrichedWithFacts = enriched.map((e) => ({
    ...e,
    historicalFacts: buildHistoricalFacts(e, memory),
  }))
  memory.historicalFacts = enrichedWithFacts.flatMap((e) => e.historicalFacts)

  // Editorial Story Engine — unified selection
  const memoryWithArcs = buildMemory(matches)
  memoryWithArcs.historicalFacts = memory.historicalFacts
  const stories = selectStories(enriched, memoryWithArcs)

  // Build bulletin for backward compat + what happened today
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
  const secondary = getSecondaryStory(stories)

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

  const standings = toStandings(standingsData)

  const brief = buildBrief(stories, memory)
  const nextChapter = buildNextChapter(brief, memoryWithArcs.narrativeArcs, memory)
  const activeNarratives = buildNarratives(memoryWithArcs.narrativeArcs, memory)

  return { matches, bulletin, stories, brief, nextChapter, activeNarratives, standings: standings.length > 0 ? standings : fallbackStandings }
}

const now = new Date()
const todayStr = now.toISOString().split("T")[0]

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

const fallbackStandings = [
  { pos: 1, flag: "🇦🇷", name: "Argentina", pts: 4, gd: "+2" },
  { pos: 2, flag: "🇲🇽", name: "México", pts: 2, gd: "0" },
  { pos: 3, flag: "🇵🇱", name: "Polônia", pts: 1, gd: "-1" },
  { pos: 4, flag: "🇸🇦", name: "Arábia Saudita", pts: 1, gd: "-1" },
]

const fallbackBrief: StoryBrief = {
  id: "brief-fallback",
  date: new Date().toISOString().split("T")[0],
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
