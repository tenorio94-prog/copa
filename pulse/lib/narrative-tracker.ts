import type { TournamentMemory, NarrativeArc, ActiveNarrative } from "./types"

const NARRATIVE_TITLES: Record<string, string> = {
  redemption_journey: "Jornada de redenção",
  cinderella_progression: "Campanha histórica",
  giant_slayer: "Caça de gigantes",
  multi_upset_run: "Série de zebras",
}

function calcChapters(arc: NarrativeArc, memory?: TournamentMemory): { current: number; total: number } {
  const journey = memory?.teamJourneys[arc.team] || []
  const relevantSteps = journey.filter((s) =>
    s.includes("Eliminou") || s.includes("Venceu") || s.includes("Perdeu") || s.includes("Eliminado")
  )
  const current = Math.min(relevantSteps.length, 6)
  const total = arc.type === "redemption_journey" ? 7 : arc.type === "cinderella_progression" ? 6 : 5
  return { current, total }
}

function calcStatus(arc: NarrativeArc, memory?: TournamentMemory): ActiveNarrative["status"] {
  const journey = memory?.teamJourneys[arc.team] || []
  const eliminated = journey.some((s) => s.includes("Eliminado por"))
  if (eliminated) return "archived"
  const finalMatch = journey.some((s) => s.includes("Final") || s.includes("campeão"))
  if (finalMatch) return "completed"
  return "active"
}

function nextChapterForType(arc: NarrativeArc): string {
  switch (arc.type) {
    case "redemption_journey": return "Buscar o título que completa a redenção"
    case "cinderella_progression": return "Continuar surpreendendo favoritos"
    case "giant_slayer": return "Derrubar o próximo gigante"
    case "multi_upset_run": return "Confirmar a campanha histórica"
    default: return "Próximo desafio"
  }
}

function importanceRank(arc: NarrativeArc, status: ActiveNarrative["status"]): number {
  if (status === "archived") return 10
  if (status === "completed") return 20
  let base = arc.editorialWeight
  if (arc.type === "redemption_journey") base += 10
  return base
}

export function buildNarratives(
  arcs: NarrativeArc[],
  memory?: TournamentMemory
): ActiveNarrative[] {
  const narratives: ActiveNarrative[] = []

  for (const arc of arcs) {
    const status = calcStatus(arc, memory)
    const chapters = calcChapters(arc, memory)
    const journey = memory?.teamJourneys[arc.team] || []

    narratives.push({
      id: `nar-${arc.team}-${arc.type}`,
      title: `${arc.team}: ${NARRATIVE_TITLES[arc.type] || arc.type}`,
      narrativeType: arc.type,
      team: arc.team,
      currentChapter: chapters.current,
      totalChaptersKnown: chapters.total,
      status,
      nextChapter: nextChapterForType(arc),
      importance: importanceRank(arc, status),
      journey: journey.slice(-3),
    })
  }

  narratives.sort((a, b) => b.importance - a.importance)

  return narratives.filter((n) => n.status !== "archived").slice(0, 3)
}
