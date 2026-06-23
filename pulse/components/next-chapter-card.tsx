import type { NextChapter } from "@/lib/types"
import { getNarrativeColor } from "@/lib/story-colors"

interface NextChapterCardProps {
  chapter: NextChapter
}

export function NextChapterCard({ chapter }: NextChapterCardProps) {
  const color = getNarrativeColor(chapter.narrativeType)

  return (
    <section className="animate-fade-up w-full">
      <div
        className="rounded-xl border p-6"
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

        {chapter.nextEvent && (
          <div className="flex items-center gap-3 text-[11px] text-[#71717a] bg-[#121214] rounded-lg px-3 py-2.5">
            <span className="font-medium text-[#f4f4f5]">{chapter.nextEvent.label}</span>
            <span>•</span>
            <span>{chapter.nextEvent.date}</span>
            <span>•</span>
            <span>{chapter.nextEvent.stage}</span>
          </div>
        )}
      </div>
    </section>
  )
}