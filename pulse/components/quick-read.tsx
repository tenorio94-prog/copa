"use client"

import type { StoryBrief } from "@/lib/types"

interface QuickReadProps {
  brief: StoryBrief
}

export function QuickRead({ brief }: QuickReadProps) {
  return (
    <section className="animate-fade-up w-full">
      <div className="rounded-xl border border-[#222226] bg-[#121214] p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
            📋 Resumo do dia
          </span>
          <span className="text-[10px] text-[#71717a]">
            {brief.readingTime}s de leitura
          </span>
        </div>
        <h2 className="font-editorial text-[clamp(20px,3.5vw,24px)] font-bold leading-[1.15] tracking-tight mb-4 text-[#f4f4f5]">
          {brief.headline}
        </h2>
        <div className="flex flex-col gap-2.5">
          {brief.bullets.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[13px] leading-snug text-[#c8c8cc]"
            >
              <span className="mt-0.5 shrink-0">{b.split(" ")[0]}</span>
              <span>{b.slice(b.indexOf(" ") + 1)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 text-[10px] text-[#71717a] border-t border-[#222226] pt-3">
          {brief.audioAvailable && (
            <span className="flex items-center gap-1">🎧 Disponível</span>
          )}
          {brief.shareText && (
            <button
              onClick={() => navigator.clipboard.writeText(brief.shareText || "")}
              className="flex items-center gap-1 text-[#818cf8] hover:text-[#6366f1] transition-colors"
            >
              📋 Compartilhar
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
