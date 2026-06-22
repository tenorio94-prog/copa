import type { Match } from "@/lib/types"
import { MatchCard } from "./match-card"

interface MatchesSectionProps {
  live: Match[]
  upcoming: Match[]
}

export function MatchesSection({ live, upcoming }: MatchesSectionProps) {
  if (live.length === 0 && upcoming.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
          ⚽ Jogos
        </h2>
        <div className="rounded-xl border border-[#222226] bg-[#121214] p-5 text-center text-sm text-[#71717a]">
          ⚽ Nenhum jogo hoje. Próximo jogo em breve.
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
        ⚽ Jogos
      </h2>
      <div className="flex gap-2">
        {live.length > 0 && live.map((m) => <MatchCard key={m.id} match={m} />)}
        {upcoming.length > 0 && upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  )
}
