import type {
  EnrichedMatch,
  TournamentMemory,
  HistoricalFact,
  NarrativeArc,
  EditorialStory,
  EditorialStoryType,
} from "./types"

const POPULAR = [
  "brazil", "argentina", "germany", "france", "england",
  "italy", "netherlands", "portugal", "spain",
]

function isPopular(name: string): boolean {
  return POPULAR.some((t) => name.toLowerCase().includes(t))
}

// ─── Story type mapping ───────────────────────────────────

function classifyStoryType(
  match: EnrichedMatch,
  arcs: NarrativeArc[],
  facts: HistoricalFact[]
): EditorialStoryType {
  const events = facts.filter((f) =>
    ["traditional_power_eliminated", "defending_champion_eliminated", "title_favorite_eliminated_early"].includes(f.id)
  )
  if (events.length > 0) return "dynasty_fall"

  const arcTypes = arcs.map((a) => a.type)
  if (arcTypes.includes("redemption_journey")) return "redemption"
  if (arcTypes.includes("cinderella_progression")) return "cinderella"
  if (arcTypes.includes("giant_slayer")) return "cinderella"
  if (arcTypes.includes("multi_upset_run")) return "upset"

  if (facts.some((f) => f.id === "first_african_semifinalist" || f.id === "years_since_last_title")) return "milestone"
  if (facts.some((f) => f.id === "giant_killing" || f.id === "streak_broken")) return "upset"
  if (facts.some((f) => f.id === "first_title_ever" || f.id === "title_drought_ended")) return "milestone"
  if (facts.some((f) => f.id === "best_result_surpassed")) return "milestone"
  if (facts.some((f) => f.id === "repeat_final" || f.id === "back_to_back_final")) return "historical"

  if (match.stage === "Final") return "historical"
  if (match.competitionImpact.eliminated && isPopular(match.loser || "")) return "elimination"
  if (match.narrativeFlags.includes("penalty_drama")) return "elimination"

  return "historical"
}

// ─── Confidence calculation ────────────────────────────────

function calcConfidence(
  match: EnrichedMatch,
  arcs: NarrativeArc[],
  facts: HistoricalFact[]
): number {
  let c = 0.1 // base

  // Editorial events (highest impact)
  const eventFacts = facts.filter((f) =>
    ["traditional_power_eliminated", "defending_champion_eliminated", "title_favorite_eliminated_early"].includes(f.id)
  )
  for (const f of eventFacts) c += f.editorialWeight / 100

  // Narrative arcs
  for (const a of arcs) c += a.editorialWeight / 100

  // Historical facts
  for (const f of facts) c += f.editorialWeight / 500

  // Specific historical fact bonuses
  const factIds = facts.map((f) => f.id)
  if (factIds.includes("first_title_ever")) c += 0.15
  if (factIds.includes("title_drought_ended")) c += 0.10
  if (factIds.includes("repeat_final")) c += 0.10
  if (factIds.includes("back_to_back_final")) c += 0.08
  if (factIds.includes("best_result_surpassed")) c += 0.12

  // Tournament stage
  if (match.stage === "Final") c += 0.5
  else if (match.stage === "Semifinal") c += 0.3
  else if (match.stage === "Mata-mata") c += 0.2

  // Popular team eliminated
  if (match.competitionImpact.eliminated && isPopular(match.loser || "")) c += 0.3

  // Penalty drama
  if (match.narrativeFlags.includes("penalty_drama")) c += 0.15

  // Upset
  if (match.narrativeFlags.includes("upset")) c += 0.15

  return Math.min(c, 1.0)
}

// ─── Evidence builder ─────────────────────────────────────

function buildEvidence(
  match: EnrichedMatch,
  arcs: NarrativeArc[],
  facts: HistoricalFact[]
): string[] {
  const ev: string[] = []

  if (match.stage === "Final") ev.push("É a final da Copa")
  if (match.competitionImpact.eliminated && isPopular(match.loser || ""))
    ev.push(`${match.loser} — uma das maiores seleções do mundo — foi eliminado`)
  if (match.narrativeFlags.includes("penalty_drama"))
    ev.push("Decisão dramática nos pênaltis")
  if (match.narrativeFlags.includes("upset"))
    ev.push("Resultado surpreendente que contrariou as expectativas")

  // Evidence from historical facts
  for (const f of facts) {
    if (f.id === "first_title_ever") ev.push(`Pode conquistar seu primeiro título mundial`)
    else if (f.id === "title_drought_ended") ev.push(`Pode encerrar jejum de ${f.description.match(/\d+/)?.[0] || "longos"} anos sem título`)
    else if (f.id === "repeat_final") ev.push(`Primeira vez que a mesma final se repete desde 1998`)
    else if (f.id === "back_to_back_final") ev.push(`Primeira final consecutiva desde 1998`)
    else if (f.id === "best_result_surpassed") ev.push(`Superou o melhor resultado da história do país`)
    else ev.push(f.description)
  }
  for (const a of arcs) ev.push(a.summary)

  return ev
}

// ─── Headline builder ─────────────────────────────────────

function buildHeadline(match: EnrichedMatch, storyType: EditorialStoryType): string {
  if (match.stage === "Final" && match.winner)
    return `${match.winner} é campeão mundial`
  if (match.penaltyScore && match.winner && match.loser)
    return `${match.winner} elimina ${match.loser} nos pênaltis`
  if (match.narrativeFlags.includes("upset") && match.winner && match.loser)
    return `${match.winner} surpreende ${match.loser}`
  if (match.winner && match.loser && match.stage !== "Fase de grupos")
    return `${match.winner} elimina ${match.loser} e avança`
  if (match.winner && match.loser)
    return `${match.winner} vence ${match.loser}`
  return `${match.homeTeam} vs ${match.awayTeam}`
}

// ─── Hook builder ─────────────────────────────────────────

function buildHook(match: EnrichedMatch, arcs: NarrativeArc[], facts: HistoricalFact[]): string {
  const eventFacts = facts.filter((f) =>
    ["traditional_power_eliminated", "defending_champion_eliminated", "title_favorite_eliminated_early"].includes(f.id)
  )

  if (eventFacts.length > 0 && match.loser && isPopular(match.loser))
    return `O mundo do futebol está de cabeça para baixo. ${match.loser} está fora da Copa.`

  if (arcs.some((a) => a.type === "redemption_journey"))
    return "A história mais improvável da Copa continua sendo escrita."

  if (arcs.some((a) => a.type === "cinderella_progression" || a.type === "giant_slayer"))
    return `O time que ninguém levava a sério acabou de eliminar mais uma favorita.`

  if (facts.some((f) => f.id === "first_african_semifinalist"))
    return "O que parecia impossível há quatro anos, hoje é realidade."

  if (match.narrativeFlags.includes("penalty_drama"))
    return "A disputa de pênaltis decidiu o destino de um gigante."

  if (match.narrativeFlags.includes("upset"))
    return "O torneio continua desafiando todas as previsões."

  return "O resultado do dia:"
}

// ─── Why it matters ───────────────────────────────────────

function buildWhyItMatters(match: EnrichedMatch, arcs: NarrativeArc[]): string {
  if (match.competitionImpact.eliminated)
    return `${match.loser} está eliminado. ${match.winner} segue vivo na competição.`
  if (match.stage === "Final" && match.winner)
    return `${match.winner} conquista o título mais importante do futebol.`
  if (arcs.some((a) => a.type === "redemption_journey"))
    return "Uma campanha de superação que será lembrada por gerações."
  if (match.narrativeFlags.includes("upset"))
    return "Resultado que muda completamente as projeções para o resto do torneio."
  return `Partida válida pela ${match.round}.`
}

// ─── Tag ──────────────────────────────────────────────────

function buildTag(storyType: EditorialStoryType): string {
  const tags: Record<EditorialStoryType, string> = {
    redemption: "🔥 Redenção",
    historical: "🏆 Histórico",
    upset: "⚡ Zebra",
    elimination: "❌ Eliminação",
    dynasty_fall: "💥 Queda de gigante",
    cinderella: "🌟 Jornada histórica",
    milestone: "📜 Marco histórico",
    rivalry: "⚔️ Clássico",
  }
  return tags[storyType]
}

// ─── Match arcs lookup ────────────────────────────────────

function arcsForMatch(match: EnrichedMatch, allArcs: NarrativeArc[]): NarrativeArc[] {
  return allArcs.filter(
    (a) => a.team === match.winner || a.team === match.loser || a.team === match.homeTeam
  )
}

function factsForMatch(match: EnrichedMatch, allFacts: HistoricalFact[]): HistoricalFact[] {
  return allFacts.filter(
    (f) => f.appliesTo === match.winner || f.appliesTo === match.loser || f.appliesTo === match.homeTeam
  )
}

// ─── Main engine ──────────────────────────────────────────

export function selectStories(
  matches: EnrichedMatch[],
  memory?: TournamentMemory
): EditorialStory[] {
  const stories: EditorialStory[] = []
  const allArcs = memory?.narrativeArcs || []
  const allFacts = memory?.historicalFacts || []
  const finished = matches.filter((m) => m.homeScore !== null || m.awayScore !== null)

  for (const match of finished) {
    const arcs = arcsForMatch(match, allArcs)
    const facts = factsForMatch(match, allFacts)
    const storyType = classifyStoryType(match, arcs, facts)
    const confidence = calcConfidence(match, arcs, facts)
    const evidence = buildEvidence(match, arcs, facts)
    const headline = buildHeadline(match, storyType)
    const narrativeHook = buildHook(match, arcs, facts)
    const whyItMatters = buildWhyItMatters(match, arcs)

    // Ensure minimum quality
    if (confidence < 0.05) continue

    stories.push({
      id: `story-${match.matchId}`,
      headline,
      storyType,
      confidence: Math.round(confidence * 100) / 100,
      evidence,
      narrativeHook,
      whyItMatters,
      priority: 0,
      matchId: match.matchId,
      tag: buildTag(storyType),
    })
  }

  // Sort by confidence descending
  stories.sort((a, b) => b.confidence - a.confidence)

  // Assign priority
  stories.forEach((s, i) => {
    s.priority = i + 1
  })

  // Rename for clarity
  if (stories.length > 0) stories[0].priority = 1
  if (stories.length > 1) stories[1].priority = 2
  if (stories.length > 2) stories[2].priority = 3

  return stories
}

export function getHeroStory(stories: EditorialStory[]): EditorialStory | null {
  return stories.find((s) => s.priority === 1) || null
}

export function getSecondaryStory(stories: EditorialStory[]): EditorialStory | null {
  return stories.find((s) => s.priority === 2) || null
}

export function getEmergingStory(stories: EditorialStory[]): EditorialStory | null {
  return stories.find((s) => s.priority === 3) || null
}
