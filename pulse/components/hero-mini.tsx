interface HeroMiniProps {
  tag: string
  headline: string
  whyItMatters: string
}

export function HeroMini({ tag, headline, whyItMatters }: HeroMiniProps) {
  return (
    <section className="animate-fade-up w-full">
      <div className="rounded-lg border border-[#222226]/60 bg-[#121214]/80 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
            🔥 História do dia
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#6366f1]/8 text-[#818cf8]/80">
            {tag}
          </span>
        </div>
        <h3 className="font-editorial text-[14px] font-semibold leading-snug tracking-tight text-[#e8e8ea]">
          {headline}
        </h3>
      </div>
    </section>
  )
}
