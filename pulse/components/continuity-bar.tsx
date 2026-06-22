import type { StoryBrief } from "@/lib/types"

interface ContinuityBarProps {
  continuity: StoryBrief["continuity"]
}

export function ContinuityBar({ continuity }: ContinuityBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#71717a]">
      <span className="inline-flex items-center gap-1 rounded-full border border-[#222226] bg-[#121214] px-3 py-1.5">
        📅 Dia {continuity.day}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-[#222226] bg-[#121214] px-3 py-1.5">
        🏆 {continuity.phase}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-[#6366f1]/20 bg-[#6366f1]/5 px-3 py-1.5 text-[#818cf8]">
        ⚽ {continuity.matchCount} jogos hoje
      </span>
      {continuity.yesterday !== "—" && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#222226] bg-[#121214] px-3 py-1.5">
          🔥 Ontem: {continuity.yesterday}
        </span>
      )}
      <span className="inline-flex items-center gap-1 rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-3 py-1.5 text-[#f59e0b]">
        👉 Hoje: {continuity.today}
      </span>
    </div>
  )
}
