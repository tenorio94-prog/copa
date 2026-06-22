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
    homeTeam: { id: "bra", name: "Brasil", code: "BRA", flag: "🇧🇷" },
    awayTeam: { id: "esp", name: "Espanha", code: "ESP", flag: "🇪🇸" },
    homeScore: 3, awayScore: 2, status: "finished",
    scheduledAt: `${todayStr}T13:00:00Z`,
    round: "Quartas de final", stage: "Mata-mata",
    importanceScore: 95,
    whyItMatters: "Brasil elimina a Espanha e enfrenta a França nas quartas.",
  },
  {
    id: "2",
    homeTeam: { id: "arg", name: "Argentina", code: "ARG", flag: "🇦🇷" },
    awayTeam: { id: "mex", name: "México", code: "MEX", flag: "🇲🇽" },
    homeScore: 0, awayScore: 0, status: "finished",
    scheduledAt: `${todayStr}T16:00:00Z`,
    round: "Fase de grupos • Grupo D", stage: "Fase de grupos",
    importanceScore: 72,
    whyItMatters: "Grupo D fica embolado. Argentina pode depender de outros resultados.",
  },
  {
    id: "3",
    homeTeam: { id: "ger", name: "Alemanha", code: "GER", flag: "🇩🇪" },
    awayTeam: { id: "jpn", name: "Japão", code: "JPN", flag: "🇯🇵" },
    homeScore: 4, awayScore: 0, status: "finished",
    scheduledAt: `${todayStr}T19:00:00Z`,
    round: "Fase de grupos • Grupo E", stage: "Fase de grupos",
    importanceScore: 68,
    whyItMatters: "Alemanha garante primeiro lugar e evita o Brasil no mata-mata.",
  },
  {
    id: "4",
    homeTeam: { id: "fra", name: "França", code: "FRA", flag: "🇫🇷" },
    awayTeam: { id: "por", name: "Portugal", code: "POR", flag: "🇵🇹" },
    homeScore: null, awayScore: null, status: "live", minute: 67,
    scheduledAt: `${todayStr}T21:00:00Z`,
    round: "Oitavas de final", stage: "Mata-mata",
    importanceScore: 88,
    whyItMatters: "Vencedor enfrenta o Brasil nas quartas.",
  },
  {
    id: "5",
    homeTeam: { id: "ned", name: "Holanda", code: "NED", flag: "🇳🇱" },
    awayTeam: { id: "uru", name: "Uruguai", code: "URU", flag: "🇺🇾" },
    homeScore: null, awayScore: null, status: "scheduled",
    scheduledAt: `${todayStr}T23:00:00Z`,
    round: "Oitavas de final", stage: "Mata-mata",
    importanceScore: 76,
    whyItMatters: "Holanda busca vaga nas quartas contra Uruguai.",
  },
]

const fallbackBulletin: Bulletin = {
  date: todayStr,
  heroHeadline: "Brasil vence e elimina a Espanha",
  heroSummary: "Richarlison decide na prorrogação. Brasil enfrenta França nas quartas.",
  heroImportanceScore: 95,
  heroTag: "🏆 Mata-mata",
  items: [
    { matchId: "1", title: "Brasil elimina Espanha", context: "3×2 • Quartas", whyItMatters: "Brasil pega a França", importanceScore: 95 },
    { matchId: "2", title: "Argentina tropeça", context: "0×0 • Grupo D", whyItMatters: "Grupo D fica aberto", importanceScore: 72 },
    { matchId: "3", title: "Alemanha goleia", context: "4×0 • Grupo E", whyItMatters: "Alemanha lidera", importanceScore: 68 },
  ],
}

const fallbackStories: EditorialStory[] = [
  {
    id: "story-1",
    headline: "Brasil vence e elimina a Espanha",
    storyType: "elimination",
    confidence: 0.95,
    evidence: ["Brasil eliminou a Espanha nas quartas", "Mata-mata decisivo"],
    narrativeHook: "O jogo mais importante do dia.",
    whyItMatters: "Brasil elimina a Espanha e enfrenta a França nas quartas.",
    priority: 1,
    matchId: "1",
    tag: "💥 Eliminação",
  },
  {
    id: "story-2",
    headline: "Argentina tropeça contra o México",
    storyType: "upset",
    confidence: 0.72,
    evidence: ["Empate surpreendente na fase de grupos"],
    narrativeHook: "Resultado que pode mudar os rumos do grupo.",
    whyItMatters: "Grupo D fica embolado.",
    priority: 2,
    matchId: "2",
    tag: "⚡ Zebra",
  },
  {
    id: "story-3",
    headline: "Alemanha goleia o Japão",
    storyType: "historical",
    confidence: 0.68,
    evidence: ["Goleada na fase de grupos"],
    narrativeHook: "Alemanha mostra força.",
    whyItMatters: "Alemanha assume liderança isolada.",
    priority: 3,
    matchId: "3",
    tag: "🏆 Histórico",
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
  headline: "Brasil vence e elimina a Espanha",
  bullets: [
    "🔥 Brasil elimina Espanha e enfrenta a França nas quartas",
    "📰 Argentina tropeça contra o México e complica o grupo",
    "⚽ Amanhã: Argentina vs França",
  ],
  continuity: {
    day: 15,
    phase: "Quartas de final",
    phaseProgress: "Quartas de final",
    matchCount: 3,
    yesterday: "Brasil: Eliminou Espanha",
    today: "Argentina vs França",
  },
  storyType: "elimination",
  tag: "💥 Eliminação",
  confidence: 0.95,
  readingTime: 15,
  shareText: "💥 Brasil elimina Espanha. copapulse.vercel.app",
  audioAvailable: false,
}

const fallbackNextChapter: NextChapter = {
  id: "next-fallback",
  narrativeType: "cinderella_run",
  headline: "Marrocos tenta continuar sua campanha histórica contra a França",
  hook: "Marrocos já eliminou favoritos e quebrou barreiras. Agora enfrenta a atual campeã mundial.",
  openQuestion: "Até onde Marrocos pode chegar? O sonho do continente africano continua.",
  nextEvent: { label: "Marrocos vs França", date: "Amanhã, 16:00", stage: "Semifinal" },
  teams: ["Marrocos"],
  confidence: 0.92,
  hasOpenQuestion: true,
}

const fallbackNarratives: ActiveNarrative[] = [
  {
    id: "nar-marrocos-cinderella",
    title: "Marrocos: Campanha histórica",
    narrativeType: "cinderella_progression",
    team: "Marrocos",
    currentChapter: 4,
    totalChaptersKnown: 6,
    status: "active",
    nextChapter: "Continuar surpreendendo favoritos",
    importance: 92,
    journey: ["Venceu Bélgica", "Eliminou Espanha", "Eliminou Portugal"],
  },
  {
    id: "nar-argentina-redemption",
    title: "Argentina: Jornada de redenção",
    narrativeType: "redemption_journey",
    team: "Argentina",
    currentChapter: 5,
    totalChaptersKnown: 7,
    status: "active",
    nextChapter: "Buscar o título que completa a redenção",
    importance: 90,
    journey: ["Perdeu para Arábia Saudita", "Eliminou Holanda", "Eliminou Croácia"],
  },
]
