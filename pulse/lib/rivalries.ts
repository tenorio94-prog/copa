const RIVALRIES: Record<string, { teamA: string; teamB: string; label: string; description: string }> = {
  "brazil-argentina": {
    teamA: "Brazil", teamB: "Argentina",
    label: "Clássico Sul-Americano",
    description: "Maior rivalidade do futebol sul-americano. Confrontos históricos em Copas desde 1974.",
  },
  "germany-italy": {
    teamA: "Germany", teamB: "Italy",
    label: "Clássico dos Campeões",
    description: "Duas potências europeias com 8 títulos mundiais combinados.",
  },
  "france-germany": {
    teamA: "France", teamB: "Germany",
    label: "Clássico Europeu",
    description: "Confrontos épicos desde 1958, incluindo finais de Copa.",
  },
  "england-germany": {
    teamA: "England", teamB: "Germany",
    label: "Rivalidade Histórica",
    description: "Final de 1966 ainda ecoa nas memórias. Inglaterra x Alemanha está sempre nas Copas.",
  },
  "argentina-england": {
    teamA: "Argentina", teamB: "England",
    label: "Rivalidade Para Sempre",
    description: "Malvinas, Mão de Deus 1986, pênaltis 1998. Mais que futebol.",
  },
  "netherlands-germany": {
    teamA: "Netherlands", teamB: "Germany",
    label: "Antigos Inimigos",
    description: "Rivalidade intensa desde 1974 (final da Copa), alemães têm vantagem histórica.",
  },
  "brazil-germany": {
    teamA: "Brazil", teamB: "Germany",
    label: "Mineirazo Ainda Ecoa",
    description: "7-1 em 2014 ainda está na memória. Brasil busca vingança esportiva.",
  },
  "brazil-france": {
    teamA: "Brazil", teamB: "France",
    label: "Memórias de 1998",
    description: "Final de 1998 (3-0 França) ainda ressoa. Brasil quer redenção.",
  },
  "portugal-spain": {
    teamA: "Portugal", teamB: "Spain",
    label: "Clássico Ibérico",
    description: "Rivalidade ibérica com Copas tensas desde 2010.",
  },
}

const RIVALRY_IDS = ["brazil", "argentina", "germany", "italy", "france", "england", "spain", "portugal", "netherlands"]

export function getRivalry(teamA: string, teamB: string): { label: string; description: string } | null {
  const a = teamA.toLowerCase()
  const b = teamB.toLowerCase()
  const hasA = RIVALRY_IDS.some(t => a.includes(t))
  const hasB = RIVALRY_IDS.some(t => b.includes(t))
  if (!hasA || !hasB) return null

  for (const [, r] of Object.entries(RIVALRIES)) {
    if ((a.includes(r.teamA.toLowerCase()) && b.includes(r.teamB.toLowerCase())) ||
        (a.includes(r.teamB.toLowerCase()) && b.includes(r.teamA.toLowerCase()))) {
      return { label: r.label, description: r.description }
    }
  }
  return null
}

export function extractTeamsFromText(text: string): string[] | null {
  const found: string[] = []
  for (const t of RIVALRY_IDS) {
    if (text.toLowerCase().includes(t)) {
      found.push(t.charAt(0).toUpperCase() + t.slice(1))
    }
  }
  return found.length >= 2 ? found : null
}
