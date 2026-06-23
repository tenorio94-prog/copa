import type { Match } from "@/lib/types"
import { MatchCard } from "./match-card"

interface MatchesSectionProps {
  live: Match[]
  finished: Match[]
  scheduled: Match[]
}

export function MatchesSection({ live, finished, scheduled }: MatchesSectionProps) {
  if (live.length === 0 && finished.length === 0 && scheduled.length === 0) {
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

      {live.length > 0 && (
        <div className="mb-3">
          <span className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[1.2px] text-[#ef4444]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ef4444]" />
            Ao vivo agora
          </span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
            {live.map((m) => (
              <div key={m.id} className="snap-start min-w-[160px] sm:min-w-0 sm:flex-1">
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div className="mb-3">
          <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[1.2px] text-[#71717a]">
            Encerrados hoje
          </span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
            {finished.map((m) => (
              <div key={m.id} className="snap-start min-w-[160px] sm:min-w-0 sm:flex-1">
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        </div>
      )}

      {scheduled.length > 0 && (
        <div className="mb-3">
          <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[1.2px] text-[#71717a]">
            Ainda vai começar
          </span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
            {scheduled.map((m) => (
              <div key={m.id} className="snap-start min-w-[160px] sm:min-w-0 sm:flex-1">
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
