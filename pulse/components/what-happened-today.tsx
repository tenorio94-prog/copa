import type { BulletinItem } from "@/lib/types"

interface WhatHappenedTodayProps {
  items: BulletinItem[]
}

function Card({ item, index }: { item: BulletinItem; index: number }) {
  return (
    <article
      className="animate-fade-up rounded-xl border border-[#222226] bg-[#1a1a1e] p-5 transition-colors hover:border-[#6366f1]/30"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold leading-snug">{item.title}</h3>
          <p className="mt-1 text-xs text-[#71717a]">{item.context}</p>
        </div>
      </div>
      <div className="mt-3 border-l-2 border-[#818cf8] bg-[#6366f1]/5 pl-3 pt-1 pb-1">
        <p className="text-xs italic leading-relaxed text-[#818cf8]">
          💡 Por que importa: {item.whyItMatters}
        </p>
      </div>
    </article>
  )
}

export function WhatHappenedToday({ items }: WhatHappenedTodayProps) {
  return (
    <section>
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
        📰 O que aconteceu hoje
      </h2>
      <div className="flex flex-col gap-3">
        {items.length === 0 && (
          <div className="rounded-xl border border-[#222226] bg-[#121214] p-6 text-center text-sm text-[#71717a]">
            🕐 Nenhum jogo ontem. Acompanhe os jogos de hoje abaixo.
          </div>
        )}
        {items.map((item, i) => (
          <Card key={item.matchId} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}
