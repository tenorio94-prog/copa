import type { Metadata } from "next"
import "./globals.css"

const siteUrl = "https://pulse-indol-sigma.vercel.app"
const siteName = "Copa Pulse"
const tagline = "O que importa, em 3 minutos"

export const metadata: Metadata = {
  title: {
    default: `${siteName} — ${tagline}`,
    template: `%s · ${siteName}`,
  },
  description: "Resumo diário da Copa do Mundo. O que aconteceu, por que importa e o que vem depois.",
  keywords: ["Copa do Mundo", "Copa 2026", "resumo", "futebol", "World Cup", "diário"],
  authors: [{ name: "Copa Pulse" }],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  themeColor: "#0a0a0b",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName,
    title: `${siteName} — ${tagline}`,
    description: "Resumo diário da Copa do Mundo. O que aconteceu, por que importa e o que vem depois.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Copa Pulse — Resumo diário da Copa do Mundo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — ${tagline}`,
    description: "Resumo diário da Copa do Mundo. O que aconteceu, por que importa e o que vem depois.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="relative min-h-screen bg-[#0a0a0b]">
        <div className="fixed inset-0 pointer-events-none z-0 bg-grid" />
        <div className="fixed inset-0 pointer-events-none z-10 bg-noise opacity-50" />
        <div className="fixed -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-[#6366f1]/5 blur-3xl pointer-events-none z-0" />
        {children}
      </body>
    </html>
  )
}
