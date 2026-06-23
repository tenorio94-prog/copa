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

  const stats = {
    mode: "daily",
    timestamp: new Date().toISOString(),
    refreshed: [] as string[],
  }

  try {
    await Promise.all([
      fetchTodaysFixtures(),
      fetchUpcoming(3),
      fetchStandings(),
    ])

    stats.refreshed.push("fixtures", "upcoming", "standings")

    revalidateTag("fixtures-today")
    revalidateTag("upcoming")
    revalidateTag("standings")

    console.log(`[cron-refresh] daily warmup: ${stats.refreshed.join(", ")}`)
  } catch (err) {
    console.error("[cron-refresh] error:", err)
    return NextResponse.json({ ...stats, error: String(err) }, { status: 500 })
  }

  return NextResponse.json(stats)
}
