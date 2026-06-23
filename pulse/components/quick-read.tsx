"use client"

import type { StoryBrief } from "@/lib/types"
import { getStoryColor } from "@/lib/story-colors"

interface QuickReadProps {
  brief: StoryBrief
}

export function QuickRead({ brief }: QuickReadProps) {
  const color = getStoryColor(brief.storyType)

  return (
    <section className="animate-fade-up w-full">
      <div
        className="rounded-xl border border-[#222226] bg-[#121214]/80 backdrop-blur-md p-6"
        style={{ backgroundImage: `linear-gradient(135deg, ${color.hex}0d 0%, transparent 60%)` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color.hex }}
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