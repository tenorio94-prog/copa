"use client"

import { useEffect, useRef } from "react"
import type { StoryBrief } from "@/lib/types"
import { TOURNAMENT_LABEL } from "@/lib/story-brief"
import { useRouter } from "next/navigation"

interface ContinuityBarProps {
  continuity: StoryBrief["continuity"]
  currentDay?: number
}

const PHASES = [
  { key: "pre", label: "Pré-Copa" },
  { key: "groups", label: "Grupos" },
  { key: "knockout", label: "Mata-mata" },
  { key: "quarters", label: "Quartas" },
  { key: "semis", label: "Semi" },
  { key: "final", label: "Final" },
  { key: "podium", label: "Pódio" },
]

const PHASE_MAP: Record<string, string> = {
  "Pré-Copa": "pre",
  "Fase de grupos": "groups",
  "Mata-mata": "knockout",
  "Quartas de final": "quarters",
  "Semifinais": "semis",
  "Semifinal": "semis",
  "Final": "final",
  "Disputa de 3º lugar": "podium",
}

function currentPhaseIndex(phase: string): number {
  const key = PHASE_MAP[phase]
  if (!key) return 1
  return PHASES.findIndex((p) => p.key === key)
}

function PhaseRail({ phase }: { phase: string }) {
  const currentIdx = currentPhaseIndex(phase)

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center gap-0 w-full">
        {PHASES.map((p, i) => {
          const isPast = i < currentIdx
          const isCurrent = i === currentIdx

          return (
            <div key={p.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "bg-amber-500 scale-125 animate-pulse-dot"
                      : isPast
                        ? "bg-[#71717a]"
                        : "bg-transparent border border-[#222226]"
                  }`}
                />
                <span className={`text-[7px] leading-none whitespace-nowrap ${
                  isCurrent ? "text-amber-400 font-medium" : "text-[#52525b]"
                }`}>
                  {i === currentIdx ? p.label : ""}
                </span>
              </div>
              {i < PHASES.length - 1 && (
                <div className={`flex-1 h-px mx-0.5 ${
                  i < currentIdx ? "bg-[#f59e0b]/40" : "bg-[#222226]"
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ContinuityBar({ continuity, currentDay }: ContinuityBarProps) {
  const router = useRouter()
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([])

  const totalDays = currentDay ?? continuity.day

  useEffect(() => {
    const idx = continuity.day - 1
    dayRefs.current[idx]?.scrollIntoView({ behavior: "instant", inline: "center", block: "nearest" })
  }, [continuity.day])

  return (
    <div className="animate-fade-up flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[1.8px] text-[#71717a]">
        {TOURNAMENT_LABEL}
      </span>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar snap-x -mx-1 px-1">
        {Array.from({ length: totalDays }, (_, i) => {
          const d = i + 1
          const isCurrent = d === continuity.day
          const isPast = d < continuity.day

          return (
            <button
              key={d}
              ref={(el) => { dayRefs.current[d - 1] = el }}
              onClick={() => router.push(`/?day=${d}`)}
              className={`snap-center shrink-0 transition-all duration-300 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] ${
                isCurrent
                  ? "bg-amber-500/15 border-amber-500/40 text-[#fbbf24] scale-105"
                  : isPast
                    ? "bg-[#1a1a1e] border-[#222226] text-[#71717a] hover:text-[#a1a1aa] hover:border-[#52525b]"
                    : "bg-transparent border-[#222226] text-[#52525b]"
              }`}
            >
              DIA {d}
            </button>
          )
        })}
      </div>

      <PhaseRail phase={continuity.phase} />

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#71717a]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/8 px-3.5 py-1.5 text-[12px] font-semibold text-[#fbbf24] shadow-sm">
          🏆 {continuity.phase}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#6366f1]/20 bg-[#6366f1]/5 px-3 py-1.5 text-[#818cf8]">
          ⚽ {continuity.matchCount} jogos hoje
        </span>
      </div>
    </div>
  )
}
