import type { EditorialStoryType } from "./types"

export interface StoryColor {
  hex: string
  hexLight: string
  label: string
  icon: string
}

const STORY_COLORS: Record<string, StoryColor> = {
  redemption: {
    hex: "#f59e0b", hexLight: "#fbbf24", label: "REDENÇÃO",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
  cinderella: {
    hex: "#10b981", hexLight: "#34d399", label: "CINDERELA",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v2M3 4l3 3 3-3M6 7v4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M4 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  },
  upset: {
    hex: "#ec4899", hexLight: "#f472b6", label: "ZEBRA",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6.5 1L4 4.5h3L4.5 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
  historical: {
    hex: "#6366f1", hexLight: "#818cf8", label: "HISTÓRICO",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10V3l2-1 2 1 2-1 2 1v7l-2-1-2 1-2-1-2 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  },
  elimination: {
    hex: "#ef4444", hexLight: "#f87171", label: "ELIMINAÇÃO",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
  dynasty_fall: {
    hex: "#ea580c", hexLight: "#fb923c", label: "QUEDA DE GIGANTE",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 10h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  },
  milestone: {
    hex: "#eab308", hexLight: "#facc15", label: "MARCO HISTÓRICO",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 7l2-2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.3"/></svg>',
  },
  rivalry: {
    hex: "#a855f7", hexLight: "#c084fc", label: "CLÁSSICO",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4v4l4 2 4-2V4L6 2 2 4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  },
  favorite_stumbles: {
    hex: "#f97316", hexLight: "#fb923c", label: "FAVORITO TROPEÇA",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v5M3 4l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 10h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  },
  statement_win: {
    hex: "#14b8a6", hexLight: "#2dd4bf", label: "DEMONSTRAÇÃO DE FORÇA",
    icon: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 8l3-5 2 3 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
}

const NARRATIVE_TYPE_TO_STORY_TYPE: Record<string, EditorialStoryType> = {
  redemption_journey: "redemption",
  cinderella_progression: "cinderella",
  cinderella_run: "cinderella",
  giant_slayer: "upset",
  multi_upset_run: "upset",
  completed: "historical",
}

export function getStoryColor(storyType: EditorialStoryType): StoryColor {
  return STORY_COLORS[storyType] ?? STORY_COLORS.historical
}

export function getNarrativeColor(narrativeType: string): StoryColor {
  const storyType = NARRATIVE_TYPE_TO_STORY_TYPE[narrativeType] ?? "historical"
  return getStoryColor(storyType)
}

