const KEY = process.env.FOOTBALL_DATA_API_KEY
if (!KEY) { console.error("FOOTBALL_DATA_API_KEY not set"); process.exit(1) }

const BASE = process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4"
const headers = { "X-Auth-Token": KEY }

async function main() {
  console.log("\n=== COMPETITIONS ===\n")
  const comps = await fetchJson("/competitions")
  if (comps?.competitions) {
    for (const c of comps.competitions) {
      if (c.name.toLowerCase().includes("world cup")) {
        console.log(`  name="${c.name}" code="${c.code}" id=${c.id} plan=${c.plan}`)
      }
    }
  }

  const code = process.env.FOOTBALL_DATA_COMPETITION || "WC"
  const today = new Date().toISOString().split("T")[0]

  console.log(`\n=== FIXTURES (${today}) [code=${code}] ===\n`)
  const fixtures = await fetchJson(`/competitions/${code}/matches?dateFrom=${today}&dateTo=${today}`)
  if (fixtures?.matches) {
    console.log(`  ${fixtures.matches.length} matches found`)
    for (const m of fixtures.matches.slice(0, 3)) {
      console.log(`  [${m.status}] ${m.homeTeam.tla} vs ${m.awayTeam.tla}`)
      console.log(`    stage=${m.stage} group=${m.group} matchday=${m.matchday}`)
      console.log(`    score: FT=${m.score.fullTime.home}-${m.score.fullTime.away}`)
      if (m.score.penalties?.home != null) console.log(`    pens: ${m.score.penalties.home}-${m.score.penalties.away}`)
      console.log(`    utcDate=${m.utcDate}`)
    }
  } else {
    console.log("  no fixtures or error")
  }

  console.log(`\n=== STANDINGS ===\n`)
  const standings = await fetchJson(`/competitions/${code}/standings?season=2026`)
  if (standings?.standings) {
    console.log(`  ${standings.standings.length} standing groups`)
    const group = standings.standings[0]
    if (group) {
      console.log(`  first: ${group.group} (${group.table?.length || 0} teams)`)
      for (const e of (group.table || []).slice(0, 4)) {
        console.log(`    ${e.position}. ${e.team.tla} ${e.team.name} — ${e.points}pts GD:${e.goalDifference}`)
      }
    }
  } else {
    console.log("  no standings or error")
  }

  console.log("\n=== DONE ===\n")
}

async function fetchJson(path) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers })
    if (res.status === 429) { console.warn("rate limited"); return null }
    if (!res.ok) { console.error(`HTTP ${res.status}`); return null }
    return await res.json()
  } catch (e) { console.error(e); return null }
}

main().catch(console.error)
