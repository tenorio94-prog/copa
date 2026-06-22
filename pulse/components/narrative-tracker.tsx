import type { ActiveNarrative } from "@/lib/types"

interface NarrativeTrackerProps {
  narratives: ActiveNarrative[]
}

function statusIcon(status: ActiveNarrative["status"]): string {
  switch (status) {
    case "active": return "▶️"
    case "completed": return "✅"
    case "archived": return "📦"
  }
}

export function NarrativeTracker({ narratives }: NarrativeTrackerProps) {
  if (narratives.length === 0) return null

  return (
    <section className="animate-fade-up w-full">
      <div className="rounded-xl border border-[#222226] bg-[#121214] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
            📖 Histórias da Copa
          </span>
          <span className="text-[9px] text-[#71717a] bg-[#1a1a1e] px-2 py-0.5 rounded">
            {narratives.filter(n => n.status === "active").length} ativas
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {narratives.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 rounded-lg bg-[#1a1a1e] border border-[#222226] p-3 transition-colors hover:border-[#6366f1]/30"
            >
              <span className="text-sm">{statusIcon(n.status)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold truncate">{n.title}</span>
                  {n.status === "active" && (
                    <span className="shrink-0 text-[9px] text-[#22c55e] bg-[#22c55e]/10 px-1.5 py-0.5 rounded">
                      Cap. {n.currentChapter}/{n.totalChaptersKnown}
                    </span>
                  )}
                  {n.status === "completed" && (
                    <span className="shrink-0 text-[9px] text-[#818cf8] bg-[#6366f1]/10 px-1.5 py-0.5 rounded">
                      ✅ Concluída
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#71717a] mt-0.5 truncate">
                  {n.status === "active" ? `Próximo: ${n.nextChapter}` : n.journey.slice(-1)[0] || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
