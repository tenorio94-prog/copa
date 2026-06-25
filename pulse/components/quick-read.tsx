"use client"

import type { StoryBrief, Match } from "@/lib/types"
import { getStoryColor } from "@/lib/story-colors"
import { extractTeamsFromText, getRivalry } from "@/lib/rivalries"

interface QuickReadProps {
  brief: StoryBrief
  heroMatch?: Match
}

function scoreDisplay(m: Match): string {
  if (m.status === "scheduled") return ""
  const h = m.homeScore ?? "?"
  const a = m.awayScore ?? "?"
  if (m.penaltyScore) return `${h}–${a} (${m.penaltyScore} pen)`
  return `${h}–${a}`
}

export function QuickRead({ brief, heroMatch }: QuickReadProps) {
  const color = getStoryColor(brief.storyType)
  const teams = extractTeamsFromText(brief.headline)
  const rivalry = teams && teams.length >= 2 ? getRivalry(teams[0], teams[1]) : null

  return (
    <section className="animate-fade-up w-full">
      <div
        className="rounded-xl border border-[#222226] bg-[#121214]/80 backdrop-blur-md p-6 relative overflow-hidden"
        style={{ borderTop: `2px solid ${color.hex}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center"
              style={{ color: color.hexLight }}
              dangerouslySetInnerHTML={{ __html: color.icon }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-[1.8px]"
              style={{ color: color.hexLight }}
            >
              {color.label}
            </span>
          </div>
          <span className="text-[10px] text-[#71717a]">
            {brief.readingTime}s de leitura
          </span>
        </div>

        {rivalry && (
          <span
            className="mb-2 inline-flex text-[9px] font-semibold uppercase tracking-[1px] px-2 py-0.5 rounded"
            style={{ backgroundColor: `${color.hex}15`, color: color.hexLight }}
          >
            {rivalry.label}
          </span>
        )}

        {heroMatch && heroMatch.status !== "scheduled" && (
          <div className="flex items-center justify-center gap-4 mb-4 py-3 rounded-lg" style={{backgroundColor: `${color.hex}0d`}}>
            <div className="flex items-center gap-2">
              <span className="text-[20px]">{heroMatch.homeTeam.flag}</span>
              <span className="text-[15px] font-semibold text-[#f4f4f5]">{heroMatch.homeTeam.code}</span>
            </div>
            <span className="text-[32px] font-black tracking-tight" style={{color: color.hexLight}}>{scoreDisplay(heroMatch)}</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-[#f4f4f5]">{heroMatch.awayTeam.code}</span>
              <span className="text-[20px]">{heroMatch.awayTeam.flag}</span>
            </div>
          </div>
        )}

        <h2 className="font-editorial text-[clamp(20px,3.5vw,24px)] font-bold leading-[1.15] tracking-tight mb-4 text-[#f4f4f5]">
          {brief.headline}
        </h2>
        <div className="flex flex-col gap-3">
          {brief.bullets.map((b, i) => {
            const isFirst = i === 0
            const emoji = b.split(" ")[0]
            const rest = b.slice(b.indexOf(" ") + 1)
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 leading-[1.5] ${
                  isFirst
                    ? "text-[14px] text-[#f4f4f5] font-medium pb-3 border-b border-[#222226]"
                    : "text-[13px] text-[#c8c8cc]"
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${isFirst ? "text-lg" : "text-base"}`}>{emoji}</span>
                <span>{rest}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-3 text-[10px] text-[#71717a] border-t border-[#222226] pt-3 flex-wrap">
          {brief.audioAvailable && (
            <span className="flex items-center gap-1">🎧 Disponível</span>
          )}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(brief.headline + " — Copa Pulse")}&url=${encodeURIComponent("https://pulse-indol-sigma.vercel.app/")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#818cf8] hover:text-[#6366f1] transition-colors"
          >
            𝕏 Compartilhar
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(brief.headline + " — Copa Pulse https://pulse-indol-sigma.vercel.app/")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#10b981] hover:text-[#059669] transition-colors"
          >
            WhatsApp
          </a>
          {brief.shareText && (
            <button
              onClick={() => navigator.clipboard.writeText(brief.shareText || "")}
              className="flex items-center gap-1 text-[#818cf8] hover:text-[#6366f1] transition-colors"
            >
              📋 Link
            </button>
          )}
        </div>
      </div>
    </section>
  )
}