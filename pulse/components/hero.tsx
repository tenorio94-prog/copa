import type { EditorialStoryType } from "@/lib/types"

interface HeroProps {
  headline: string
  summary: string
  tag: string
  storyType?: EditorialStoryType
  confidence?: number
}

export function Hero({ headline, summary, tag, storyType, confidence }: HeroProps) {
  return (
    <section className="animate-fade-up w-full">
      <div className="rounded-2xl border border-[#6366f1]/20 bg-gradient-to-br from-[#6366f1]/12 to-[#a78bfa]/6 p-7 text-center md:p-10 md:pt-12 md:pb-10">
        <span className="inline-block rounded-full border border-[#6366f1]/20 bg-[#6366f1]/8 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[#818cf8]">
          {tag}
        </span>
        <h1 className="mt-4 text-[clamp(24px,5vw,36px)] font-bold leading-[1.08] tracking-tight">
          {headline}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#a1a1aa] md:text-base">
          {summary}
        </p>
        {confidence !== undefined && (
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-[#71717a]">
            <span>confiança editorial: {Math.round(confidence * 100)}%</span>
            {storyType && <span>• {storyType}</span>}
          </div>
        )}
      </div>
    </section>
  )
}
