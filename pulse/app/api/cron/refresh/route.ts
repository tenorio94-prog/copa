import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import {
  fetchTodaysFixtures,
  fetchUpcoming,
  fetchStandings,
} from "@/lib/football-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expected = process.env.VERCEL_CRON_SECRET
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const hourUTC = new Date().getUTCHours()

  let mode: "full" | "fixtures-only" | "skip" = "skip"

  try {
    const todayResult = await fetchTodaysFixtures()
    const liveFixtures = todayResult.items.filter(
      (f) => f.status === "LIVE" || f.status === "IN_PLAY" || f.status === "PAUSED"
    )
    const hasLive = liveFixtures.length > 0

    if (hasLive) {
      mode = "full"
    } else if (hourUTC >= 12 && hourUTC < 24) {
      mode = "fixtures-only"
    } else if (todayResult.items.length > 0) {
      mode = "fixtures-only"
    } else {
      mode = "skip"
    }
  } catch {
    mode = "skip"
  }

  const stats = {
    mode,
    timestamp: new Date().toISOString(),
    refreshed: [] as string[],
  }

  if (mode === "skip") {
    revalidateTag("fixtures-today")
    return NextResponse.json({ ...stats, message: "no fixtures or off-hours, tag revalidate only" })
  }

  try {
    if (mode === "full") {
      await Promise.all([
        fetchTodaysFixtures(),
        fetchUpcoming(3),
        fetchStandings(),
      ])
      stats.refreshed.push("fixtures", "upcoming", "standings")
    } else {
      await fetchTodaysFixtures()
      stats.refreshed.push("fixtures")
    }

    revalidateTag("fixtures-today")
    revalidateTag("upcoming")
    revalidateTag("standings")

    console.log(`[cron-refresh] mode=${mode} refreshed=${stats.refreshed.join(",")}`)
  } catch (err) {
    console.error("[cron-refresh] error:", err)
    return NextResponse.json({ ...stats, error: String(err) }, { status: 500 })
  }

  return NextResponse.json(stats)
}
