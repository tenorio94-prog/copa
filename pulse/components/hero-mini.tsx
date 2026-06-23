import { getStoryColor } from "@/lib/story-colors"
import type { EditorialStoryType } from "@/lib/types"

interface HeroMiniProps {
  tag: string
  headline: string
  whyItMatters: string
  storyType?: EditorialStoryType
}

export function HeroMini({ tag, headline, whyItMatters, storyType = "historical" }: HeroMiniProps) {
  const color = getStoryColor(storyType)

  return (
    <section className="animate-fade-up-delayed w-full">
      <div
        className="rounded-lg bg-[#121214]/80 backdrop-blur-md p-4 border-l-2"
        style={{
          borderColor: color.hex,
          backgroundImage: `linear-gradient(90deg, ${color.hex}0a 0%, transparent 50%)`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color.hex }}
          />
          <span
            className="text-[9px] font-bold uppercase tracking-[1.5px]"
            style={{ color: color.hexLight }}
          >
            {color.label}
          </span>
          <span className="text-[9px] text-[#71717a]">•</span>
          <span className="text-[9px] text-[#71717a]">{tag}</span>
        </div>
        <h3 className="font-editorial text-[16px] font-semibold leading-[1.2] tracking-tight text-[#e8e8ea] mb-1.5">
          {headline}
        </h3>
        {whyItMatters && (
          <p className="text-[11px] italic leading-relaxed text-[#a1a1aa]">
            {whyItMatters}
          </p>
        )}
      </div>
    </section>
  )
}