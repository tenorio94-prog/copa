export function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[#222226] bg-[#0a0a0b]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#6366f1] px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
            CP
          </span>
          <span className="text-sm font-semibold">Copa Pulse</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-[#a1a1aa] md:flex">
        </nav>
        <button className="flex items-center justify-center text-[#a1a1aa] md:hidden">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
