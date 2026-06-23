import { NavBar } from "@/components/navbar"
import { MatchesSection } from "@/components/matches-section"
import { QuickRead } from "@/components/quick-read"
import { ContinuityBar } from "@/components/continuity-bar"
import { NextChapterCard } from "@/components/next-chapter-card"
import { NarrativeTracker } from "@/components/narrative-tracker"
import { HeroMini } from "@/components/hero-mini"
import { fetchDashboardData } from "@/lib/mock-data"
import { getHeroStory } from "@/lib/editorial-story-engine"

export default async function Home() {
  const { matches, bulletin, stories, brief, nextChapter, activeNarratives, standings, standingsGroupName } = await fetchDashboardData()
  const liveMatches = matches.filter((m) => m.status === "live")
  const upcomingMatches = matches.filter((m) => m.status !== "live" && m.status !== "finished")
  const hero = getHeroStory(stories)

  const isGroupStage = brief.continuity.phase.toLowerCase().includes("grupos")

  return (
    <>
      <NavBar />
      <main className="relative z-10 mx-auto max-w-[1200px] px-4 pt-20 pb-12">
        <div className="mx-auto max-w-[480px] md:max-w-none">
          <div className="md:grid md:grid-cols-[1.5fr_1fr] md:gap-8">
            <div className="flex flex-col gap-4">
              {/* 1. Continuity Bar — orientação */}
              <ContinuityBar continuity={brief.continuity} />

              {/* 2. Quick Read — 15s, o produto */}
              <QuickRead brief={brief} />

              {/* 3. Next Chapter — retenção (logo após QuickRead) */}
              {nextChapter?.hasOpenQuestion && (
                <NextChapterCard chapter={nextChapter} />
              )}

              {/* 4. Hero Mini — compacto, sem redundância */}
              {hero && (
                <HeroMini
                  tag={hero.tag}
                  headline={hero.headline}
                  whyItMatters={hero.whyItMatters}
                  storyType={hero.storyType}
                />
              )}

              {/* 5. Narrative Tracker — apenas se relevante */}
              {activeNarratives.length > 0 && (
                <NarrativeTracker narratives={activeNarratives} />
              )}

              {/* 6. Matches (mobile only) */}
              <div className="md:hidden">
                <MatchesSection live={liveMatches} upcoming={upcomingMatches} />
              </div>
            </div>

            {/* Sidebar — desktop */}
            <div className="hidden md:flex md:flex-col md:gap-5 md:pt-0">
              <MatchesSection live={liveMatches} upcoming={upcomingMatches} />

              {activeNarratives.length > 0 && (
                <NarrativeTracker narratives={activeNarratives} />
              )}

              {isGroupStage && (
                <section>
                  <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
                    📊 Tabela • {standingsGroupName || "Grupo C"}
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
                <div className="flex items-center justify-center gap-4 text-xs text-[#a1a1aa]">
                  <span>Compartilhe:</span>
                  <button className="transition-colors hover:text-[#f4f4f5]">X</button>
                  <button className="transition-colors hover:text-[#f4f4f5]">WhatsApp</button>
                  <button className="transition-colors hover:text-[#f4f4f5]">📋 Link</button>
                </div>
                <p className="mt-2 text-[10px] text-[#71717a]">
                  Copa Pulse • {brief.headline.substring(0, 24)}...
                </p>
              </footer>
            </div>
          </div>

          {/* Mobile footer */}
          <div className="mt-6 md:hidden">
            {isGroupStage && (
              <section className="mb-6">
                <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#71717a]">
                  📊 Tabela • {standingsGroupName || "Grupo C"}
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
              <div className="flex items-center justify-center gap-4 text-xs text-[#a1a1aa]">
                <span>Compartilhe:</span>
                <button className="transition-colors hover:text-[#f4f4f5]">X</button>
                <button className="transition-colors hover:text-[#f4f4f5]">WhatsApp</button>
                <button className="transition-colors hover:text-[#f4f4f5]">📋 Link</button>
              </div>
              <p className="mt-2 text-[10px] text-[#71717a]">
                Copa Pulse • {brief.headline.substring(0, 24)}...
              </p>
            </footer>
          </div>
        </div>
      </main>
    </>
  )
}
