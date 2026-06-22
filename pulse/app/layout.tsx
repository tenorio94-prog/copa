import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Copa Pulse — O que importa, em 3 minutos",
  description:
    "Resumo diário da Copa do Mundo. O que aconteceu, por que importa e o que vem depois.",
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
        <div className="fixed -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-[#6366f1]/5 blur-3xl pointer-events-none z-0" />
        {children}
      </body>
    </html>
  )
}
