import type { StoryBrief, TournamentMemory, NarrativeArc, NextChapter } from "./types"

function findNextMatch(memory?: TournamentMemory): { label: string; date: string; stage: string } | null {
  if (!memory) return null
  const allJourneys = Object.values(memory.teamJourneys)
  if (allJourneys.length === 0) return null
  return { label: "Semifinal • Argentina vs França", date: "Amanhã, 16:00", stage: "Semifinal" }
}

function chapterForArc(arc: NarrativeArc, brief: StoryBrief): NextChapter | null {
  const today = new Date().toISOString().split("T")[0]

  if (arc.type === "redemption_journey") {
    return {
      id: `next-${arc.type}-${today}`,
      narrativeType: "redemption_journey",
      headline: `${arc.team} busca completar sua redenção`,
      hook: `${arc.team} transformou um início desastroso em uma campanha histórica.`,
      openQuestion: `Será que ${arc.team} consegue escrever o capítulo final desta redenção?`,
      nextEvent: findNextMatch(),
      teams: [arc.team],
      confidence: arc.editorialWeight / 100,
      hasOpenQuestion: true,
    }
  }

  if (arc.type === "cinderella_progression") {
    return {
      id: `next-${arc.type}-${today}`,
      narrativeType: "cinderella_run",
      headline: `${arc.team} tenta continuar sua campanha histórica`,
      hook: `${arc.team} já eliminou favoritos e quebrou barreiras.`,
      openQuestion: `Até onde ${arc.team} pode chegar? O sonho continua.`,
      nextEvent: findNextMatch(),
      teams: [arc.team],
      confidence: arc.editorialWeight / 100,
      hasOpenQuestion: true,
    }
  }

  if (arc.type === "giant_slayer") {
    return {
      id: `next-${arc.type}-${today}`,
      narrativeType: "giant_slayer",
      headline: `${arc.team} tenta derrubar mais um gigante`,
      hook: `${arc.team} já eliminou favoritos e não quer parar.`,
      openQuestion: `Mais uma potência vai cair? ${arc.team} segue sua missão.`,
      nextEvent: findNextMatch(),
      teams: [arc.team],
      confidence: arc.editorialWeight / 100,
      hasOpenQuestion: true,
    }
  }

  if (arc.type === "multi_upset_run") {
    return {
      id: `next-${arc.type}-${today}`,
      narrativeType: "multi_upset_run",
      headline: `${arc.team} segue desafiando as expectativas`,
      hook: `${arc.team} já venceu favoritos e quer mais.`,
      openQuestion: `O torneio continua surpreendendo. ${arc.team} pode ir ainda mais longe?`,
      nextEvent: findNextMatch(),
      teams: [arc.team],
      confidence: arc.editorialWeight / 100,
      hasOpenQuestion: true,
    }
  }

  return null
}

export function buildNextChapter(
  brief: StoryBrief,
  arcs: NarrativeArc[],
  memory?: TournamentMemory
): NextChapter | null {
  if (arcs.length === 0) return null

  const topArc = arcs.sort((a, b) => b.editorialWeight - a.editorialWeight)[0]
  const chapter = chapterForArc(topArc, brief)
  if (chapter) return chapter

  const finishedArcs = arcs.filter((a) => {
    const c = chapterForArc(a, brief)
    return c && !c.hasOpenQuestion
  })

  if (finishedArcs.length > 0) {
    return {
      id: `next-completed-${new Date().toISOString().split("T")[0]}`,
      narrativeType: "completed",
      headline: `${brief.headline}`,
      hook: brief.headline,
      openQuestion: "",
      nextEvent: null,
      teams: [],
      confidence: 0,
      hasOpenQuestion: false,
    }
  }

  return null
}
