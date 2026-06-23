import type { EditorialStoryType } from "./types"

export interface StoryColor {
  hex: string
  hexLight: string
  label: string
}

const STORY_COLORS: Record<EditorialStoryType, StoryColor> = {
  redemption: { hex: "#f59e0b", hexLight: "#fbbf24", label: "REDENÇÃO" },
  cinderella: { hex: "#10b981", hexLight: "#34d399", label: "CINDERELA" },
  upset: { hex: "#ec4899", hexLight: "#f472b6", label: "ZEBRA" },
  historical: { hex: "#6366f1", hexLight: "#818cf8", label: "HISTÓRICO" },
  elimination: { hex: "#ef4444", hexLight: "#f87171", label: "ELIMINAÇÃO" },
  dynasty_fall: { hex: "#ea580c", hexLight: "#fb923c", label: "QUEDA DE GIGANTE" },
  milestone: { hex: "#eab308", hexLight: "#facc15", label: "MARCO HISTÓRICO" },
  rivalry: { hex: "#a855f7", hexLight: "#c084fc", label: "CLÁSSICO" },
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