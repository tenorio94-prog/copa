import type { EnrichedMatch, TournamentMemory } from "../types"
import type { LlmProvider } from "./provider"
import { buildPrompt } from "./provider"
import { openaiProvider } from "./openai"
import { deepseekProvider } from "./deepseek"

function selectProvider(): LlmProvider | null {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase()

  switch (provider) {
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY ? deepseekProvider : null
    case "openai":
      return process.env.OPENAI_API_KEY ? openaiProvider : null
    default:
      return null
  }
}

export async function generateBulletinContent(
  enrichedMatches: EnrichedMatch[],
  memory?: TournamentMemory
): Promise<{ headline: string; summary: string; whyItMatters: Record<string, string> } | null> {
  if (enrichedMatches.length === 0) return null

  const provider = selectProvider()
  if (!provider) return null

  const prompt = buildPrompt(enrichedMatches, memory)
  const result = await provider.call(prompt)

  if (!result) return null

  const whyMap: Record<string, string> = {}
  if (enrichedMatches.length > 0) {
    whyMap[enrichedMatches[0].matchId] = result.why_it_matters
  }

  return {
    headline: result.headline,
    summary: result.summary,
    whyItMatters: whyMap,
  }
}
