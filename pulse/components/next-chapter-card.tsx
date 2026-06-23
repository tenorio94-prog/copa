import type { NextChapter } from "@/lib/types"
import { getNarrativeColor } from "@/lib/story-colors"

interface NextChapterCardProps {
  chapter: NextChapter
}

function parseNextEvent(dateStr: string): { label: string; bg: string; text: string; border: string; urgent: boolean } {
  const lower = dateStr.toLowerCase()

  if (lower.includes("min") || lower.includes("ao vivo")) {
    return { label: "AO VIVO", bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.3)", urgent: true }
  }

  if (lower.includes("agora")) {
    return { label: "AGORA", bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.3)", urgent: true }
  }

  if (lower.includes("amanhã") || lower.includes("amanha")) {
    return { label: "AMANHÃ", bg: "rgba(99,102,241,0.1)", text: "#818cf8", border: "rgba(99,102,241,0.3)", urgent: false }
  }

  if (lower.includes("hoje")) {
    return { label: "HOJE", bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)", urgent: false }
  }

  if (lower.includes("em") && lower.includes("h")) {
    const h = parseInt(lower.match(/em\s*(\d+)\s*h/)?.[1] || "0", 10)
    if (h <= 1) {
      return { label: `EM ${h}H`, bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.3)", urgent: h <= 1 }
    }
    return { label: `EM ${h}H`, bg: "rgba(245,158,11,0.1)", text: "#fbbf24", border: "rgba(245,158,11,0.3)", urgent: false }
  }

  if (lower.includes("em") && lower.includes("dia")) {
    return { label: "EM BREVE", bg: "rgba(113,113,122,0.1)", text: "#a1a1aa", border: "rgba(113,113,122,0.3)", urgent: false }
  }

  return { label: "EM BREVE", bg: "rgba(113,113,122,0.1)", text: "#a1a1aa", border: "rgba(113,113,122,0.3)", urgent: false }
}

export function NextChapterCard({ chapter }: NextChapterCardProps) {
  const color = getNarrativeColor(chapter.narrativeType)

  const countdown = chapter.nextEvent
    ? parseNextEvent(chapter.nextEvent.date)
    : null

  return (
    <section className="animate-fade-up-delayed w-full">
      <div
        className="rounded-xl border p-6 backdrop-blur-md"
        style={{
          backgroundImage: `linear-gradient(135deg, ${color.hex}1f 0%, ${color.hexLight}0a 70%)`,
          borderColor: `${color.hex}40`,
        }}
      >
        <div className="flex items-center gap-2 mb-3.5">
          <span
            className="inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color.hex }}
          />
          <span
            className="text-[9px] font-bold uppercase tracking-[1.8px]"
            style={{ color: color.hexLight }}
          >
            PRÓXIMO CAPÍTULO
          </span>
        </div>

        <h3 className="font-editorial text-[clamp(18px,3vw,22px)] font-bold leading-[1.15] tracking-tight mb-3 text-[#f4f4f5]">
          {chapter.headline}
        </h3>

        <p className="text-[13px] leading-relaxed text-[#a1a1aa] mb-4">
          {chapter.hook}
        </p>

        {chapter.openQuestion && (
          <div
            className="border-l-2 pl-3 py-1 mb-4"
            style={{ borderColor: color.hex }}
          >
            <p
              className="font-editorial text-[clamp(15px,2.5vw,18px)] italic leading-relaxed font-medium"
              style={{ color: "#e8e8ea" }}
            >
              {chapter.openQuestion}
            </p>
          </div>
        )}

        {chapter.nextEvent && countdown && (
          <div className="flex items-center gap-3 text-[11px] bg-[#121214] rounded-lg px-3 py-2.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: countdown.bg,
                color: countdown.text,
                border: `1px solid ${countdown.border}`,
                ...(countdown.urgent ? { animation: "pulse-dot 1.5s infinite" } : {}),
              }}
            >
              {countdown.label}
            </span>
            <span className="font-medium text-[#f4f4f5]">{chapter.nextEvent.label}</span>
            <span className="text-[#71717a]">{chapter.nextEvent.stage}</span>
          </div>
        )}
      </div>
    </section>
  )
}
