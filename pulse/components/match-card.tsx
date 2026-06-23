import type { Match } from "@/lib/types"

interface MatchCardProps {
  match: Match
}

export function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === "live"
  const isScheduled = match.status === "scheduled"
  const isFinished = match.status === "finished"

  const scoreDisplay = isScheduled ? (
    <span className="text-lg font-bold text-[#a1a1aa]">-</span>
  ) : (
    <span className="text-lg font-bold">
      {match.homeScore} – {match.awayScore}
    </span>
  )

  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-[#222226] bg-[#121214] p-3.5 text-center transition-colors hover:border-[#6366f1]/30">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>{match.homeTeam.flag}</span>
        <span>{match.homeTeam.code}</span>
        <span className="mx-1">{scoreDisplay}</span>
        <span>{match.awayTeam.code}</span>
        <span>{match.awayTeam.flag}</span>
      </div>

      {isLive && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#ef4444]">
          <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ef4444]" />
          AO VIVO{match.minute ? ` • ${match.minute}'` : ""}
        </div>
      )}

      {isFinished && (
        <span className="text-[10px] text-[#71717a]">Encerrado</span>
      )}

      {isScheduled && (
        <span className="text-[10px] text-[#71717a]">
          {new Date(match.scheduledAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  )
}
