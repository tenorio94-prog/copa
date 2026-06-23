import type { ActiveNarrative } from "@/lib/types"
import { getNarrativeColor } from "@/lib/story-colors"

interface NarrativeTrackerProps {
  narratives: ActiveNarrative[]
}

function NarrativeRow({ n }: { n: ActiveNarrative }) {
  const color = getNarrativeColor(n.narrativeType)
  const progress = n.totalChaptersKnown > 0
    ? Math.min(n.currentChapter / n.totalChaptersKnown, 1)
    : 0

  return (
    <div
      className="flex items-start gap-3 rounded-lg bg-[#1a1a1e] border border-[#222226] p-3"
      style={{ borderLeft: `2px solid ${color.hex}` }}
    >
      <span
        className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: n.status === "active" ? color.hex : n.status === "completed" ? "#22c55e" : "#52525b",
          ...(n.status === "active" ? { animation: "pulse-dot 1.5s infinite" } : {}),
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-[13px] font-semibold truncate leading-snug">{n.title}</span>
          {n.status === "completed" && (
            <span className="shrink-0 text-[9px] font-medium text-[#22c55e] bg-[#22c55e]/10 px-1.5 py-0.5 rounded leading-none">
              ✅ Concluída
            </span>
          )}
        </div>

        {n.status === "active" && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-1 flex-1 max-w-[100px] rounded-full bg-[#222226] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress * 100}%`, backgroundColor: color.hex }}
              />
            </div>
            <span
              className="text-[9px] font-medium leading-none"
              style={{ color: color.hexLight }}
            >
              Cap. {n.currentChapter}/{n.totalChaptersKnown}
            </span>
          </div>
        )}

        <p className="text-[11px] text-[#71717a] leading-snug truncate mb-1.5">
          {n.status === "active" ? `Próximo: ${n.nextChapter}` : n.journey.slice(-1)[0] || ""}
        </p>

        {n.journey.length > 0 && n.status !== "completed" && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {n.journey.map((step, i) => {
              const isLast = i === n.journey.length - 1
              return (
                <div key={i} className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded leading-none truncate max-w-[80px] ${
                      isLast
                        ? "font-medium"
                        : "text-[#71717a] bg-[#222226]/50"
                    }`}
                    style={isLast ? { color: color.hexLight, backgroundColor: `${color.hex}1a` } : {}}
                  >
                    {step}
                  </span>
                  {!isLast && <span className="text-[#3a3a3e] text-[8px]">›</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function NarrativeTracker({ narratives }: NarrativeTrackerProps) {
  if (narratives.length === 0) return null

  return (
    <section className="animate-fade-up-late w-full">
      <div className="rounded-xl border border-[#222226] bg-[#121214]/80 backdrop-blur-md p-4">
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
            <NarrativeRow key={n.id} n={n} />
          ))}
        </div>
      </div>
    </section>
  )
}
