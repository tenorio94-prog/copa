import type { EnrichedMatch, TournamentMemory, HistoricalContext, TeamFormEntry, HistoricalFact } from "../types"

export interface LlmOutput {
  headline: string
  summary: string
  why_it_matters: string
}

export interface LlmProvider {
  name: string
  call(prompt: string): Promise<LlmOutput | null>
}

function stripInternalFields(m: EnrichedMatch) {
  return {
    placar: `${m.homeTeam} ${m.score} ${m.awayTeam}`,
    vencedor: m.winner,
    perdedor: m.loser,
    fase: m.stage,
    rodada: m.round,
    eliminado: m.competitionImpact.eliminated,
    flags: m.narrativeFlags,
    story_candidates: m.storyCandidates.map((s) => ({ type: s.type, reason: s.reason })),
    penalty: m.penaltyScore ? `Decisão nos pênaltis: ${m.penaltyScore}` : null,
    historical_context: m.historicalContext,
    team_form: m.teamForm,
  }
}

export function buildPrompt(matches: EnrichedMatch[], memory?: TournamentMemory): string {
  const matchData = matches.slice(0, 5).map(stripInternalFields)

  let prompt = JSON.stringify(matchData, null, 2)

  if (memory) {
    const parts: string[] = []

    const journeyLines: string[] = []
    for (const [team, steps] of Object.entries(memory.teamJourneys)) {
      if (steps.length > 0) {
        journeyLines.push(`${team}: ${steps.join(" → ")}`)
      }
    }
    if (journeyLines.length > 0) {
      parts.push("JORNADA DAS EQUIPES:\n" + journeyLines.join("\n"))
    }

    if (memory.narratives.length > 0) {
      parts.push("CONTEXTO NARRATIVO:\n" + memory.narratives.join("\n"))
    }

    const historicalParts: string[] = []
    for (const [team, ctx] of Object.entries(memory.historicalContexts)) {
      const active = Object.entries(ctx).filter(([, v]) => v === true || (typeof v === "number" && v !== null))
      if (active.length > 0) {
        historicalParts.push(`${team}: ${active.map(([k]) => k.replace(/_/g, " ")).join(", ")}`)
      }
    }
    if (historicalParts.length > 0) {
      parts.push("CONTEXTO HISTÓRICO:\n" + historicalParts.join("\n"))
    }

    if (memory.historicalFacts && memory.historicalFacts.length > 0) {
      const factLines = memory.historicalFacts
        .sort((a, b) => b.editorialWeight - a.editorialWeight)
        .map((f) => `  • ${f.description}`)
      parts.push("FATOS HISTÓRICOS:\n" + factLines.join("\n"))
    }

    if (memory.narrativeArcs && memory.narrativeArcs.length > 0) {
      const arcLines = memory.narrativeArcs
        .sort((a, b) => b.editorialWeight - a.editorialWeight)
        .map((a) => `  • ${a.summary}`)
      parts.push("ARCO NARRATIVO:\n" + arcLines.join("\n"))
    }

    if (parts.length > 0) {
      prompt += "\n\n" + parts.join("\n\n")
    }
  }

  return prompt
}

export const SYSTEM_PROMPT = `Você é o editor do Copa Pulse, um produto que responde "o que importa na Copa hoje?"

Regras:

1. HEADLINE: até 15 palavras. Verbo de ação. Sem clickbait. Priorize consequência.
2. SUMMARY: 1-2 frases. Contexto para o torcedor casual.
3. WHY_IT_MATTERS: Foco em consequência para o torneio. O que muda depois deste jogo? Impacto para o torcedor casual.

Considere os FATOS HISTÓRICOS, ARCOS NARRATIVOS, story_candidates, team_form, historical_context e contexto narrativo ao decidir o que destacar. ARCOS NARRATIVOS conectam múltiplos jogos de uma mesma equipe ao longo do torneio — use-os para construir uma história maior.

NUNCA:
- Repetir o placar no why_it_matters
- Usar frases genéricas como "foi um grande jogo"
- Exagerar ("melhor jogo da história")
- Usar jargão técnico
- Inventar informações que não estão nos dados

Responda APENAS em JSON. Sem texto antes ou depois.
Formato: { "headline": string, "summary": string, "why_it_matters": string }`
