import type { EnrichedMatch } from "./types"

function headline(e: EnrichedMatch): string {
  const { winner, loser, homeTeam, awayTeam, penaltyScore } = e

  if (penaltyScore) {
    if (winner) return `${winner} elimina ${loser} nos pênaltis (${penaltyScore})`
    return `Decisão nos pênaltis: ${homeTeam} vs ${awayTeam} (${penaltyScore})`
  }

  if (e.stage === "Final" && winner) {
    return `${winner} é campeão mundial`
  }
  if (e.stage === "Final") {
    return `Final: ${homeTeam} vs ${awayTeam}`
  }

  if (e.stage === "Fase de grupos") {
    if (e.narrativeFlags.includes("upset")) {
      return `${winner || awayTeam} surpreende ${loser || homeTeam} na fase de grupos`
    }
    return `${homeTeam} e ${awayTeam} se enfrentam na fase de grupos`
  }

  if (winner && loser) {
    if (e.narrativeFlags.includes("blowout")) {
      return `${winner} atropela ${loser} e avança no torneio`
    }
    return `${winner} elimina ${loser} e segue no torneio`
  }

  return `${homeTeam} enfrenta ${awayTeam}`
}

function summary(e: EnrichedMatch): string {
  const { winner, loser, homeTeam, awayTeam, homeScore, awayScore, penaltyScore, stage } = e

  if (penaltyScore && winner && loser) {
    const scoreStr = homeScore !== null && awayScore !== null ? `${homeScore}–${awayScore}` : "0–0"
    return `${winner} venceu ${loser} nos pênaltis por ${penaltyScore} após empate por ${scoreStr}.`
  }

  if (stage === "Final" && winner) {
    if (penaltyScore) {
      const scoreStr = homeScore !== null && awayScore !== null ? `${homeScore}–${awayScore}` : "0–0"
      return `${winner} é campeão mundial ao vencer ${loser} nos pênaltis por ${penaltyScore} após ${scoreStr}.`
    }
    return `${winner} é campeão mundial ao vencer ${loser} por ${homeScore}–${awayScore}.`
  }

  if (winner && loser && stage !== "Fase de grupos") {
    return `${winner} eliminou ${loser} e avançou na competição.`
  }

  if (e.narrativeFlags.includes("upset") && winner) {
    return `${winner} venceu ${loser} em um resultado surpreendente.`
  }

  if (homeScore !== null && awayScore !== null) {
    return `${homeTeam} ${homeScore}–${awayScore} ${awayTeam}.`
  }

  return `${homeTeam} vs ${awayTeam}.`
}

function why(e: EnrichedMatch): string {
  const { winner, loser, penaltyScore, stage, narrativeFlags } = e

  if (stage === "Final" && winner) {
    return `${winner} é campeão mundial. Para o torcedor casual: este é o jogo que define uma geração. ${loser} terá que esperar quatro anos para tentar novamente.`
  }

  if (penaltyScore && winner && loser) {
    return `${loser} está eliminado nos pênaltis. ${winner} segue vivo. Para o torcedor casual: decisão por pênaltis é sempre dramática — qualquer coisa poderia ter acontecido.`
  }

  if (e.competitionImpact.eliminated && winner) {
    return `${loser} está fora da Copa. ${winner} segue vivo. Para o torcedor casual: esse resultado muda completamente as projeções para o resto do torneio.`
  }

  if (e.competitionImpact.qualified && winner) {
    return `${winner} avança de fase e continua na briga pelo título. Cada jogo agora é decisivo.`
  }

  if (narrativeFlags.includes("upset")) {
    return `Resultado surpreendente que pode ter grandes consequências na classificação do grupo. Times favoritos agora precisam reagir.`
  }

  return `O resultado impacta a classificação e define os rumos da competição.`
}

export function templateHeadline(matches: EnrichedMatch[]): string {
  if (matches.length === 0) return "Aguardando jogos da Copa"
  return headline(matches[0])
}

export function templateSummary(matches: EnrichedMatch[]): string {
  if (matches.length === 0) return "Os primeiros jogos começam em breve."
  return matches.slice(0, 3).map(summary).join(" ")
}

export function templateWhyItMatters(match: EnrichedMatch): string {
  return why(match)
}

export function templateTag(stage: string, flags: string[]): string {
  if (stage === "Fase de grupos") return "⚽ Fase de grupos"
  if (flags.includes("penalty_drama")) return "⚡ Decisão nos pênaltis"
  if (flags.includes("elimination")) return "🏆 Eliminatória"
  return "🏆 Mata-mata"
}
