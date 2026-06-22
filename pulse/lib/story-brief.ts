import type { EditorialStory, TournamentMemory, StoryBrief } from "./types"

function calcDay(memory?: TournamentMemory): number {
  if (!memory) return 1
  const allSteps = Object.values(memory.teamJourneys).flat()
  if (allSteps.length === 0) return 1
  return Math.max(Math.ceil(allSteps.length / 4), 1)
}

function calcPhase(memory?: TournamentMemory): string {
  if (!memory) return "Copa do Mundo"
  const allSteps = Object.values(memory.teamJourneys).flat()
  const koCount = allSteps.filter((s) => s.includes("Eliminou") || s.includes("Eliminado")).length
  if (koCount >= 14) return "Final"
  if (koCount >= 10) return "Semifinais"
  if (koCount >= 6) return "Quartas de final"
  if (koCount >= 2) return "Mata-mata"
  return "Fase de grupos"
}

function calcMatchCount(memory?: TournamentMemory): number {
  if (!memory) return 0
  const today = new Date().toISOString().split("T")[0]
  const allSteps = Object.values(memory.teamJourneys).flat()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  return allSteps.length > 0 ? Math.min(allSteps.length, 6) : 2
}

function findYesterday(memory?: TournamentMemory): string {
  if (!memory) return "—"
  const lines: string[] = []
  for (const [team, steps] of Object.entries(memory.teamJourneys)) {
    const last = steps[steps.length - 1]
    if (last && (last.includes("Eliminou") || last.includes("Venceu"))) {
      lines.push(`${team}: ${last}`)
    }
  }
  return lines.length > 0 ? lines[lines.length - 1] : "—"
}

function findToday(): string {
  return "Argentina vs França"
}

function makeBullet(hero: EditorialStory): string {
  const parts = hero.evidence.filter(Boolean)
  const evidence = parts.length > 0 ? ` — ${parts[0]}` : ""
  const emoji = hero.storyType === "milestone" ? "🌍" : hero.storyType === "redemption" ? "🔥" : hero.storyType === "dynasty_fall" ? "💥" : hero.storyType === "cinderella" ? "🌟" : "⚽"
  return `${emoji} ${hero.headline}${evidence}`
}

function makeSecondaryBullet(secondary: EditorialStory | null): string {
  if (!secondary) return "⚽ Dia sem outros jogos de destaque"
  return `📰 ${secondary.headline}`
}

function makeEmergingBullet(emerging: EditorialStory | null, hero: EditorialStory): string {
  if (emerging) return `⚽ ${emerging.headline}`
  return `⚽ Amanhã: ${findToday()}`
}

function buildShareText(headline: string, stories: EditorialStory[]): string | null {
  if (stories.length === 0) return null
  const top = stories[0]
  return `${top.tag} ${headline}. copapulse.vercel.app`
}

export function buildBrief(
  stories: EditorialStory[],
  memory?: TournamentMemory
): StoryBrief {
  const sorted = [...stories].sort((a, b) => a.priority - b.priority)
  const hero = sorted[0] || stories[0]
  const secondary = sorted[1] || null
  const emerging = sorted[2] || null

  const headline = hero?.headline ?? "Aguardando jogos da Copa"
  const bullets: [string, string, string] = [
    makeBullet(hero),
    makeSecondaryBullet(secondary),
    makeEmergingBullet(emerging, hero),
  ]

  return {
    id: `brief-${new Date().toISOString().split("T")[0]}`,
    date: new Date().toISOString().split("T")[0],
    headline,
    bullets,
    continuity: {
      day: calcDay(memory),
      phase: calcPhase(memory),
      phaseProgress: calcPhase(memory),
      matchCount: calcMatchCount(memory),
      yesterday: findYesterday(memory),
      today: findToday(),
    },
    storyType: hero?.storyType ?? "historical",
    tag: hero?.tag ?? "📅 Copa",
    confidence: hero?.confidence ?? 0,
    readingTime: 15,
    shareText: buildShareText(headline, sorted),
    audioAvailable: false,
  }
}
