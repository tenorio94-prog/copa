interface HeroMiniProps {
  tag: string
  headline: string
  whyItMatters: string
}

export function HeroMini({ tag, headline, whyItMatters }: HeroMiniProps) {
  return (
    <section className="animate-fade-up w-full">
      <div className="rounded-lg border border-[#222226] bg-[#121214] p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
            🔥 História do dia
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#6366f1]/10 text-[#818cf8]">
            {tag}
          </span>
        </div>
        <h3 className="text-[14px] font-bold leading-snug tracking-tight">
          {headline}
        </h3>
        <p className="text-[11px] leading-relaxed text-[#a1a1aa] mt-1">
          {whyItMatters}
        </p>
      </div>
    </section>
  )
}
