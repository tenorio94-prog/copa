"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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

function haptic(ms = 8) {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms)
}

export function QuickRead({ brief, heroMatch }: QuickReadProps) {
  const color = getStoryColor(brief.storyType)
  const teams = extractTeamsFromText(brief.headline)
  const rivalry = teams && teams.length >= 2 ? getRivalry(teams[0], teams[1]) : null

  const [step, setStep] = useState(0)
  const totalSteps = 1 + (brief.bullets?.length || 0)
  const progress = totalSteps > 1 ? ((step + 1) / totalSteps) * 100 : 100
  const containerRef = useRef<HTMLDivElement>(null)

  const advance = useCallback(() => {
    if (step < totalSteps - 1) { setStep(s => s + 1); haptic(8) }
  }, [step, totalSteps])

  const regress = useCallback(() => {
    if (step > 0) { setStep(s => s - 1); haptic(5) }
  }, [step])

  useEffect(() => { setStep(0) }, [brief.id])

  return (
    <section className="animate-fade-up w-full">
      <div
        ref={containerRef}
        className="relative cursor-pointer select-none rounded-xl border border-[#222226] bg-[#121214]/80 backdrop-blur-md p-6 overflow-hidden"
        style={{ borderTop: `2px solid ${color.hex}` }}
        onClick={(e) => {
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          const x = e.clientX - rect.left
          if (x > rect.width / 2) advance()
          else regress()
        }}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -inset-32 rounded-full blur-3xl opacity-[0.08] animate-pulse"
          style={{ backgroundColor: color.hex }} />

        {/* Progress bar */}
        <div className="relative z-10 mb-4 flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i}
              className="h-0.5 flex-1 rounded-full transition-all duration-500"
              style={{ backgroundColor: i <= step ? color.hexLight : "#222226" }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="relative z-10 transition-all duration-300">
          {step === 0 && (
            <div className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center" style={{ color: color.hexLight }}
                    dangerouslySetInnerHTML={{ __html: color.icon }} />
                  <span className="text-[9px] font-bold uppercase tracking-[1.8px]" style={{ color: color.hexLight }}>
                    {color.label}
                  </span>
                </div>
                <span className="text-[10px] text-[#71717a]">{brief.readingTime}s de leitura</span>
              </div>

              {rivalry && (
                <span className="mb-2 inline-flex text-[9px] font-semibold uppercase tracking-[1px] px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${color.hex}15`, color: color.hexLight }}>
                  {rivalry.label}
                </span>
              )}

              {heroMatch && heroMatch.status !== "scheduled" && (
                <div className="flex items-center justify-center gap-4 mb-4 py-3 rounded-lg animate-fade-up"
                  style={{ backgroundColor: `${color.hex}0d` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[20px]">{heroMatch.homeTeam.flag}</span>
                    <span className="text-[15px] font-semibold text-[#f4f4f5]">{heroMatch.homeTeam.code}</span>
                  </div>
                  <span className="text-[32px] font-black tracking-tight" style={{ color: color.hexLight }}>
                    {scoreDisplay(heroMatch)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#f4f4f5]">{heroMatch.awayTeam.code}</span>
                    <span className="text-[20px]">{heroMatch.awayTeam.flag}</span>
                  </div>
                </div>
              )}

              <h2 className="font-editorial text-[clamp(20px,3.5vw,24px)] font-bold leading-[1.15] tracking-tight mb-2 text-[#f4f4f5]">
                {brief.headline}
              </h2>
              <p className="text-[11px] text-[#71717a] mt-2">Toque no lado direito para avançar</p>
            </div>
          )}

          {step >= 1 && step - 1 < (brief.bullets?.length || 0) && (
            <div className="animate-fade-up py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg shrink-0">{step === 1 ? "📰" : "⚽"}</span>
                <p className="text-[14px] leading-relaxed text-[#e8e8ea]">
                  {brief.bullets[step - 1]}
                </p>
              </div>
            </div>
          )}

          {step === totalSteps - 1 && (
            <div className="animate-fade-up flex flex-col items-center justify-center py-8 text-center">
              <h3 className="font-editorial text-[18px] font-bold text-[#f4f4f5] mb-1">Você está por dentro</h3>
              <p className="text-[12px] text-[#71717a]">{brief.bullets?.length || 0} histórias em {brief.readingTime}s</p>
            </div>
          )}
        </div>

        {/* Share */}
        <div className="relative z-10 mt-4 flex items-center gap-3 text-[10px] text-[#71717a] border-t border-[#222226] pt-3 flex-wrap">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(brief.headline + " — Copa Pulse")}&url=${encodeURIComponent("https://pulse-indol-sigma.vercel.app/")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#818cf8] hover:text-[#6366f1] transition-colors">𝕏 Compartilhar</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(brief.headline + " — Copa Pulse https://pulse-indol-sigma.vercel.app/")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#10b981] hover:text-[#059669] transition-colors">WhatsApp</a>
          {brief.shareText && (
            <button onClick={() => navigator.clipboard.writeText(brief.shareText || "")}
              className="flex items-center gap-1 text-[#818cf8] hover:text-[#6366f1] transition-colors">📋 Link</button>
          )}
        </div>
      </div>
    </section>
  )
}
