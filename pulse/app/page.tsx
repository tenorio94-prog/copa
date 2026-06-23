import type { Metadata } from "next"
import { NavBar } from "@/components/navbar"
import { MatchesSection } from "@/components/matches-section"
import { QuickRead } from "@/components/quick-read"
import { ContinuityBar } from "@/components/continuity-bar"
import { NextChapterCard } from "@/components/next-chapter-card"
import { NarrativeTracker } from "@/components/narrative-tracker"
import { HeroMini } from "@/components/hero-mini"
import { ShareButtons } from "@/components/share-buttons"
import { fetchDashboardData } from "@/lib/mock-data"

function truncateAtWord(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const trimmed = text.slice(0, maxChars)
  const lastSpace = trimmed.lastIndexOf(" ")
  return lastSpace > 10 ? text.slice(0, lastSpace) : trimmed.trimEnd()
}

export const metadata: Metadata = {
  title: "Resumo diário — Copa do Mundo 2026",
  description: "O que aconteceu hoje, por que importa e o que vem depois. 3 minutos de leitura.",
}

export default async function Home({ searchParams }: { searchParams?: { day?: string } }) {
  const targetDay = parseInt(searchParams?.day || "0", 10) || 0
  const { matches, bulletin, stories, brief, nextChapter, activeNarratives, standings, standingsGroupName } = await fetchDashboardData(targetDay)
  const liveMatches = matches.filter((m) => m.status === "live")
  const finishedMatches = matches.filter((m) => m.status === "finished")
  const scheduledMatches = matches.filter((m) => m.status === "scheduled")
  const heroMiniStory = stories.length > 1 ? stories[1] : null

  if (standings.length === 0) {
    console.warn("[real-data] standings empty for stage:", brief.continuity.phase)
  }

  const isGroupStage = brief.continuity.phase.toLowerCase().includes("grupos")

  return (
    <>
      <NavBar />
      <main className="relative z-10 mx-auto max-w-[1200px] px-4 pt-20 pb-12">
        <div className="mx-auto max-w-[480px] md:max-w-none">
          <div className="md:grid md:grid-cols-[1.5fr_1fr] md:gap-8">
            <div className="flex flex-col gap-4">
              {/* 1. Continuity Bar — orientação */}
              <ContinuityBar continuity={brief.continuity} currentDay={brief.continuity.day} />

              {/* 2. Quick Read — 15s, o produto */}
              <QuickRead brief={brief} />

              {/* 3. Next Chapter — retenção (logo após QuickRead) */}
              {nextChapter?.hasOpenQuestion && (
                <NextChapterCard chapter={nextChapter} />
              )}

              {/* 4. Hero Mini — segunda story do dia (evita duplicar QuickRead) */}
              {heroMiniStory && (
                <HeroMini
                  tag={heroMiniStory.tag}
                  headline={heroMiniStory.headline}
                  whyItMatters={heroMiniStory.whyItMatters}
                  storyType={heroMiniStory.storyType}
                />
              )}

              {/* 5. Narrative Tracker (mobile apenas — desktop tem no sidebar) */}
              {activeNarratives.length > 0 && (
                <div className="md:hidden">
                  <NarrativeTracker narratives={activeNarratives} />
                </div>
              )}

              {/* 6. Matches (mobile only) */}
              <div className="md:hidden">
                <MatchesSection live={liveMatches} finished={finishedMatches} scheduled={scheduledMatches} />
              </div>
            </div>

            {/* Sidebar — desktop */}
            <div className="hidden md:flex md:flex-col md:gap-5 md:pt-0">
              <MatchesSection live={liveMatches} finished={finishedMatches} scheduled={scheduledMatches} />

              {activeNarratives.length > 0 && (
                <NarrativeTracker narratives={activeNarratives} />
              )}

              {isGroupStage && standings.length > 0 && (
                <section>
                  <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
                    📊 Tabela • {standingsGroupName || "Grupo A"}
                  </h2>
                  <div className="rounded-xl border border-[#222226] bg-[#121214] p-3">
                    <div className="flex flex-col gap-1">
                      {standings.map((t) => (
                        <div
                          key={t.pos}
                          className="flex items-center justify-between rounded-md bg-[#1a1a1e] px-2.5 py-1.5 text-[11px]"
                        >
                          <span className="font-medium text-[#f4f4f5]">
                            {t.pos}. {t.flag} {t.name}
                          </span>
                          <span className="text-[#a1a1aa]">
                            {t.pts} pts {t.gd}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <footer className="mt-auto rounded-xl border border-[#222226] bg-[#121214] p-4 text-center">
                <ShareButtons text={`${brief.headline} — Copa Pulse`} url="https://pulse-indol-sigma.vercel.app/" />
                <p className="mt-2 text-[10px] text-[#71717a]">
                  Copa Pulse • {truncateAtWord(brief.headline, 28)}
                </p>
              </footer>
            </div>
          </div>

          {/* Mobile footer */}
          <div className="mt-6 md:hidden">
            {isGroupStage && standings.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
                  📊 Tabela • {standingsGroupName || "Grupo A"}
                </h2>
                <div className="rounded-xl border border-[#222226] bg-[#121214] p-3">
                  <div className="flex flex-col gap-1">
                    {standings.map((t) => (
                      <div
                        key={t.pos}
                        className="flex items-center justify-between rounded-md bg-[#1a1a1e] px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="font-medium text-[#f4f4f5]">
                          {t.pos}. {t.flag} {t.name}
                        </span>
                        <span className="text-[#a1a1aa]">
                          {t.pts} pts {t.gd}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <footer className="rounded-xl border border-[#222226] bg-[#121214] p-4 text-center">
              <ShareButtons text={`${brief.headline} — Copa Pulse`} url="https://pulse-indol-sigma.vercel.app/" />
              <p className="mt-2 text-[10px] text-[#71717a]">
                Copa Pulse • {truncateAtWord(brief.headline, 28)}
              </p>
            </footer>
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Copa Pulse",
              "url": "https://pulse-indol-sigma.vercel.app",
              "description": "Resumo diário da Copa do Mundo. O que aconteceu, por que importa e o que vem depois.",
              "inLanguage": "pt-BR",
              "about": {
                "@type": "SportsEvent",
                "name": "Copa do Mundo FIFA 2026",
                "sport": "Soccer",
                "startDate": "2026-06-11",
                "url": "https://pulse-indol-sigma.vercel.app",
              },
            }),
          }}
        />
      </main>
    </>
  )
}
