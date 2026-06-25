"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { StoryBrief, Match } from "@/lib/types"
import { getStoryColor } from "@/lib/story-colors"
import { extractTeamsFromText, getRivalry } from "@/lib/rivalries"
import { motion, AnimatePresence } from "framer-motion"

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

const springFast = { type: "spring" as const, stiffness: 200, damping: 22 }
const springMedium = { type: "spring" as const, stiffness: 140, damping: 20 }

export function QuickRead({ brief, heroMatch }: QuickReadProps) {
  const color = getStoryColor(brief.storyType)
  const teams = extractTeamsFromText(brief.headline)
  const rivalry = teams && teams.length >= 2 ? getRivalry(teams[0], teams[1]) : null

  const [step, setStep] = useState(0)
  const totalSteps = 1 + (brief.bullets?.length || 0)
  const containerRef = useRef<HTMLDivElement>(null)

  const advance = useCallback(() => {
    if (step < totalSteps - 1) { setStep(s => s + 1); haptic(8) }
  }, [step, totalSteps])

  const regress = useCallback(() => {
    if (step > 0) { setStep(s => s - 1); haptic(5) }
  }, [step])

  useEffect(() => { setStep(0) }, [brief.id])

  return (
    <section className="w-full">
      {// @ts-expect-error
}<motion.div
        ref={containerRef}
        className="relative cursor-pointer select-none rounded-xl border border-[#222226] bg-[#121214]/80 backdrop-blur-md p-6 overflow-hidden"
        style={{ borderTop: `2px solid ${color.hex}` }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: springMedium }}
        onClick={(e) => {
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          const x = e.clientX - rect.left
          if (x > rect.width / 2) advance()
          else regress()
        }}
      >
        {// @ts-expect-error
}<motion.div className="pointer-events-none absolute -inset-32 rounded-full blur-3xl"
          style={{ backgroundColor: color.hex, opacity: 0.15 }}
          animate={{ opacity: [0.08, 0.2, 0.08] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 mb-4 flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i}
              className="h-0.5 flex-1 rounded-full transition-all duration-500"
              style={{ backgroundColor: i <= step ? color.hexLight : "#222226" }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {// @ts-expect-error
}<AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="score"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: springFast }}
                exit={{ opacity: 0, y: -16, transition: { duration: 0.15 } }}
              >
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
                  <div className="flex items-center justify-center gap-4 mb-4 py-3 rounded-lg"
                    style={{ backgroundColor: `${color.hex}0d` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">{heroMatch.homeTeam.flag}</span>
                      <span className="text-[15px] font-semibold text-[#f4f4f5]">{heroMatch.homeTeam.code}</span>
                    </div>
                    {// @ts-expect-error
}<motion.span className="text-[32px] font-black tracking-tight" style={{ color: color.hexLight }}
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, transition: { ...springFast, delay: 0.1 } }}
                    >
                      {scoreDisplay(heroMatch)}
                    </motion.span>
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
              </motion.div>
            )}

            {step >= 1 && step - 1 < (brief.bullets?.length || 0) && (
              <motion.div key={`b${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, transition: springFast }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.12 } }}
              >
                <div className="flex items-start gap-3 py-4">
                  <span className="mt-0.5 text-lg shrink-0">{step === 1 ? "📰" : "⚽"}</span>
                  <p className="text-[14px] leading-relaxed text-[#e8e8ea]">
                    {brief.bullets[step - 1]}
                  </p>
                </div>
              </motion.div>
            )}

            {step === totalSteps - 1 && (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, transition: springMedium }}
              >
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <h3 className="font-editorial text-[18px] font-bold text-[#f4f4f5] mb-1">Você está por dentro</h3>
                  <p className="text-[12px] text-[#71717a]">{brief.bullets?.length || 0} histórias em {brief.readingTime}s</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
      </motion.div>
    </section>
  )
}
