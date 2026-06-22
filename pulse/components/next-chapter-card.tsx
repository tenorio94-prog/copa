import type { NextChapter } from "@/lib/types"

interface NextChapterCardProps {
  chapter: NextChapter
}

export function NextChapterCard({ chapter }: NextChapterCardProps) {
  return (
    <section className="animate-fade-up w-full">
      <div className="rounded-xl border border-[#6366f1]/20 bg-gradient-to-br from-[#6366f1]/8 to-[#a78bfa]/4 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#818cf8]">
            📖 Próximo capítulo
          </span>
          {chapter.confidence > 0 && (
            <span className="text-[9px] text-[#71717a] bg-[#6366f1]/10 px-2 py-0.5 rounded">
              {Math.round(chapter.confidence * 100)}%
            </span>
          )}
        </div>

        <h3 className="text-[16px] font-bold leading-snug tracking-tight mb-2">
          {chapter.headline}
        </h3>

        <p className="text-[13px] leading-relaxed text-[#a1a1aa] mb-3">
          {chapter.hook}
        </p>

        {chapter.openQuestion && (
          <div className="border-l-2 border-[#818cf8] pl-3 py-1 mb-3">
            <p className="text-[12px] italic leading-relaxed text-[#818cf8]">
              {chapter.openQuestion}
            </p>
          </div>
        )}

        {chapter.nextEvent && (
          <div className="flex items-center gap-3 text-[11px] text-[#71717a] bg-[#121214] rounded-lg px-3 py-2">
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
