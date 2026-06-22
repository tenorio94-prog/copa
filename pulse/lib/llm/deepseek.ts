import type { LlmProvider, LlmOutput } from "./provider"
import { SYSTEM_PROMPT } from "./provider"

const API_URL = "https://api.deepseek.com/v1/chat/completions"

function apiKey(): string | undefined {
  return process.env.DEEPSEEK_API_KEY
}

function model(): string {
  return process.env.DEEPSEEK_MODEL || "deepseek-chat"
}

export const deepseekProvider: LlmProvider = {
  name: "deepseek",

  async call(prompt: string): Promise<LlmOutput | null> {
    const key = apiKey()
    if (!key) return null

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model(),
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Dados dos jogos de hoje:\n\n${prompt}\n\nResponda APENAS com o JSON.` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!res.ok) return null

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content
      if (!content) return null

      return JSON.parse(content) as LlmOutput
    } catch {
      return null
    }
  },
}
