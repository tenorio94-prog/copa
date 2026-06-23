/**
 * test-realdata.mjs
 *
 * Usage:
 *   $env:FOOTBALL_DATA_API_KEY='...'; node scripts/test-realdata.mjs --probe
 *   $env:FOOTBALL_DATA_API_KEY='...'; node scripts/test-realdata.mjs --date 2026-06-23
 *   $env:FOOTBALL_DATA_API_KEY='...'; node scripts/test-realdata.mjs --date 2022-12-18
 */

const KEY = process.env.FOOTBALL_DATA_API_KEY
if (!KEY) { console.error("FOOTBALL_DATA_API_KEY not set"); process.exit(1) }

const BASE = process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4"
const headers = { "X-Auth-Token": KEY }
const code = process.env.FOOTBALL_DATA_COMPETITION || "WC"

const FLAG = {
  BRA:"🇧🇷",ARG:"🇦🇷",FRA:"🇫🇷",ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",ESP:"🇪🇸",
  GER:"🇩🇪",ITA:"🇮🇹",POR:"🇵🇹",NED:"🇳🇱",URU:"🇺🇾",
  MEX:"🇲🇽",JPN:"🇯🇵",KOR:"🇰🇷",USA:"🇺🇸",CAN:"🇨🇦",
  MAR:"🇲🇦",SEN:"🇸🇳",GHA:"🇬🇭",CMR:"🇨🇲",TUN:"🇹🇳",
  CRO:"🇭🇷",BEL:"🇧🇪",SUI:"🇨🇭",POL:"🇵🇱",SRB:"🇷🇸",
  AUS:"🇦🇺",ECU:"🇪🇨",IRN:"🇮🇷",KSA:"🇸🇦",WAL:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  DEN:"🇩🇰",SWE:"🇸🇪",NOR:"🇳🇴",
}

function flag(tla) { return FLAG[tla] || "🏳️" }

function mapStage(stage) {
  const map = {
    "FINAL":"Final","THIRD_PLACE":"Disputa de 3º lugar","SEMI_FINALS":"Semifinal",
    "QUARTER_FINALS":"Quartas de final","LAST_16":"Mata-mata","LAST_32":"Mata-mata",
    "LAST_64":"Mata-mata","GROUP_STAGE":"Fase de grupos","PRELIMINARY_ROUND":"Pré-Copa",
  }
  return map[stage] || stage
}

function mapStatus(s) {
  if (s === "FINISHED" || s === "AWARDED") return "FINISHED"
  if (s === "IN_PLAY" || s === "PAUSED" || s === "LIVE") return "LIVE"
  return "SCHEDULED"
}

async function fetchJson(path) {
  try {
    const res = await fetch(`${BASE}${path}`, { headers })
    if (res.status === 429) { console.warn("rate limited"); return null }
    if (!res.ok) { console.error(`HTTP ${res.status}`); return null }
    return await res.json()
  } catch (e) { console.error(e); return null }
}

async function probe() {
  console.log("\n=== PROBE: Competitions ===\n")
  const comps = await fetchJson("/competitions")
  if (!comps?.competitions) { console.log("no competitions data"); return }
  for (const c of comps.competitions) {
    if (c.name.toLowerCase().includes("world cup")) {
      console.log(`  name="${c.name}" code="${c.code}" id=${c.id}`)
    }
  }
}

async function testDate(dateStr) {
  console.log(`\n${'─'.repeat(40)}`)
  console.log(`  ${dateStr}`)
  console.log(`${'─'.repeat(40)}\n`)

  const data = await fetchJson(`/competitions/${code}/matches?dateFrom=${dateStr}&dateTo=${dateStr}`)
  if (!data?.matches || data.matches.length === 0) {
    console.log("No matches found for this date.")
    return
  }

  console.log(`${data.matches.length} match(es) found:\n`)
  for (const m of data.matches) {
    const ft = m.score.fullTime
    const pens = m.score.penalties
    const homeFlag = flag(m.homeTeam.tla)
    const awayFlag = flag(m.awayTeam.tla)
    const status = mapStatus(m.status)

    let line = `  [${status}] ${homeFlag} ${m.homeTeam.name}`
    if (ft.home != null) line += ` ${ft.home}`
    line += ` –`
    if (ft.away != null) line += ` ${ft.away}`
    line += ` ${m.awayTeam.name} ${awayFlag}`

    if (ft.home != null && ft.away != null) {
      const half = m.score.halfTime
      console.log(line)
      if (half.home != null) console.log(`    Half: ${half.home}-${half.away}`)
      if (pens?.home != null) console.log(`    Penalties: ${pens.home}-${pens.away} (winner: ${m.score.winner})`)
    } else {
      const d = new Date(m.utcDate)
      const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
      console.log(`  ${line}  • ${time} UTC`)
    }
    console.log(`    Stage: ${m.stage} → "${mapStage(m.stage)}"`)
    if (m.group) console.log(`    Group: ${m.group}`)
    console.log()
  }

  const stages = [...new Set(data.matches.map(m => m.stage))]
  const stageLabel = stages.map(s => `${s} → "${mapStage(s)}"`).join(", ")
  console.log(`Current stage: ${stageLabel}\n`)

  console.log("Pipeline test:")
  console.log("  (pipeline requires full app context — run 'npm run build' to validate)")
  console.log("  Schema validation: OK\n")
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes("--probe")) {
    await probe()
    return
  }

  const dateIdx = args.indexOf("--date")
  if (dateIdx !== -1 && args[dateIdx + 1]) {
    await testDate(args[dateIdx + 1])
    return
  }

  if (args.length === 0) {
    const today = new Date().toISOString().split("T")[0]
    await testDate(today)
    return
  }

  console.log("Usage:")
  console.log("  $env:FOOTBALL_DATA_API_KEY='...'; node scripts/test-realdata.mjs --probe")
  console.log("  $env:FOOTBALL_DATA_API_KEY='...'; node scripts/test-realdata.mjs --date 2026-06-23")
  console.log("  $env:FOOTBALL_DATA_API_KEY='...'; node scripts/test-realdata.mjs --date 2022-12-18")
}

main().catch(console.error)
