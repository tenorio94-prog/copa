"use client"

interface ShareButtonsProps {
  text: string
  url?: string
  variant?: "footer" | "inline"
}

export function ShareButtons({ text, url = "https://pulse-indol-sigma.vercel.app/", variant = "footer" }: ShareButtonsProps) {
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(url)

  const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`

  const btnClass = variant === "footer"
    ? "transition-colors hover:text-[#f4f4f5] cursor-pointer"
    : "flex items-center gap-1 text-[#818cf8] hover:text-[#6366f1] transition-colors"

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt("Copie o link:", url)
    }
  }

  return (
    <div className="flex items-center justify-center gap-4 text-xs text-[#a1a1aa]">
      <span>Compartilhe:</span>
      <a href={xUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        X
      </a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        WhatsApp
      </a>
      <button onClick={copyLink} className={`${btnClass} flex items-center gap-1`}>
        📋 Link
      </button>
    </div>
  )
}
