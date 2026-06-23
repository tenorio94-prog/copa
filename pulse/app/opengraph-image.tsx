import { ImageResponse } from "@vercel/og"
import { fetchDashboardData } from "@/lib/mock-data"
import { getStoryColor } from "@/lib/story-colors"
import type { EditorialStoryType } from "@/lib/types"

export const alt = "Copa Pulse — Resumo diário da Copa do Mundo"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "edge"

export default async function OGImage() {
  let title = "Copa do Mundo 2026"
  let subtitle = "O que importa, em 3 minutos"
  let badgeColor = "#6366f1"
  let badgeLabel = "Copa Pulse"

  try {
    const data = await fetchDashboardData()
    if (data?.brief) {
      title = data.brief.headline
      subtitle = data.brief.continuity.phase
      const color = getStoryColor(data.brief.storyType as EditorialStoryType)
      badgeColor = color.hex
      badgeLabel = color.label
    }
  } catch {
    console.warn("[og] fetchDashboardData failed, using defaults")
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a0b 0%, #1a1a1e 100%)",
          padding: "60px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div style={{
            width: "40px", height: "40px",
            background: badgeColor, borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: "22px", fontWeight: 700,
          }}>
            CP
          </div>
          <div style={{ color: "#f4f4f5", fontSize: "24px", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
            Copa Pulse
          </div>
        </div>

        <div style={{
          display: "flex", backgroundColor: `${badgeColor}20`,
          color: badgeColor, padding: "8px 16px", borderRadius: "6px",
          fontSize: "16px", fontWeight: 700, letterSpacing: "1.5px",
          textTransform: "uppercase", marginBottom: "20px",
          alignSelf: "flex-start",
        }}>
          {badgeLabel}
        </div>

        <div style={{
          color: "#f4f4f5", fontSize: "44px", fontWeight: 800,
          letterSpacing: "-1px", lineHeight: 1.1,
          flex: 1, display: "flex", alignItems: "center",
          fontFamily: "Inter, sans-serif",
        }}>
          {title}
        </div>

        <div style={{
          color: "#71717a", fontSize: "22px", fontWeight: 400,
          marginTop: "20px",
        }}>
          {subtitle} • 3 minutos de leitura
        </div>
      </div>
    ),
    size
  )
}
