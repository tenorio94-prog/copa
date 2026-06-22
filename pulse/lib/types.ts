export interface Team {
  id: string
  name: string
  code: string
  flag: string
}

export interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  penaltyScore?: string
  status: "scheduled" | "live" | "finished"
  minute?: number
  scheduledAt: string
  round: string
  stage: string
  importanceScore: number
  whyItMatters: string | null
}

export interface BulletinItem {
  matchId: string
  title: string
  context: string
  whyItMatters: string
  importanceScore: number
}

export interface Bulletin {
  date: string
  heroHeadline: string
  heroSummary: string
  heroImportanceScore: number
  heroTag: string
  items: BulletinItem[]
}

export type StoryType =
  | "underdog" | "legacy" | "redemption" | "rivalry"
  | "breakthrough" | "elimination" | "qualification"
  | "last_dance" | "revenge" | "cinderella_run"
  | "legacy_complete" | "historical_first"

export type NarrativeFlag =
  | "big_team_win" | "upset"
  | "elimination" | "qualification" | "high_stakes"
  | "blowout" | "comeback" | "penalty_drama"
  | "historical"

export interface StoryCandidate {
  type: StoryType
  score: number
  reason?: string
}

export interface HistoricalContext {
  first_african_semifinalist: boolean
  defending_champion: boolean
  host_nation: boolean
  years_since_last_title: number | null
}

export interface TeamFormEntry {
  lost_opener: boolean
  current_streak: number
  momentum: "recovering" | "dominant" | "struggling" | "neutral"
}

export interface TeamForm {
  [team: string]: TeamFormEntry
}

export interface EnrichedMatch {
  matchId: string
  winner: string | null
  loser: string | null
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  penaltyScore: string | null
  score: string
  stage: string
  round: string
  competitionImpact: {
    eliminated: string | null
    nextOpponent: string | null
    qualified: boolean
  }
  narrativeFlags: NarrativeFlag[]
  simpleImpact: {
    classification: string
    consequence: string
    tournamentEffect: string
  }
  storyCandidates: StoryCandidate[]
  historicalContext: HistoricalContext
  teamForm: TeamFormEntry
}

export interface TournamentMemory {
  teamJourneys: Record<string, string[]>
  narratives: string[]
  teamForm: TeamForm
  historicalContexts: Record<string, HistoricalContext>
  historicalFacts: HistoricalFact[]
  narrativeArcs: NarrativeArc[]
}

export interface HistoricalFact {
  id: string
  editorialWeight: number
  description: string
  appliesTo: string
}

export interface NarrativeArc {
  type: "multi_upset_run" | "cinderella_progression" | "redemption_journey" | "giant_slayer"
  team: string
  editorialWeight: number
  description: string
  summary: string
}

export type EditorialStoryType =
  | "redemption"
  | "historical"
  | "upset"
  | "elimination"
  | "dynasty_fall"
  | "cinderella"
  | "milestone"
  | "rivalry"

export interface EditorialStory {
  id: string
  headline: string
  storyType: EditorialStoryType
  confidence: number
  evidence: string[]
  narrativeHook: string
  whyItMatters: string
  priority: number
  matchId: string
  tag: string
}

export interface StoryBrief {
  id: string
  date: string
  headline: string
  bullets: [string, string, string]
  continuity: {
    day: number
    phase: string
    phaseProgress: string
    matchCount: number
    yesterday: string
    today: string
  }
  storyType: EditorialStoryType
  tag: string
  confidence: number
  readingTime: number
  shareText: string | null
  audioAvailable: boolean
}

export interface NextChapter {
  id: string
  narrativeType: string
  headline: string
  hook: string
  openQuestion: string
  nextEvent: {
    label: string
    date: string
    stage: string
  } | null
  teams: string[]
  confidence: number
  hasOpenQuestion: boolean
}

export interface ActiveNarrative {
  id: string
  title: string
  narrativeType: string
  team: string
  currentChapter: number
  totalChaptersKnown: number
  status: "active" | "completed" | "archived"
  nextChapter: string
  importance: number
  journey: string[]
}
