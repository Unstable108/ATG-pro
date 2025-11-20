// components/TopBar.jsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function TopBar({
  onOpenChapters,
  onSearch,
  initialSearch = '',
  isHidden = false,
}) {
  const [q, setQ] = useState(initialSearch)
  const [siteTheme, setSiteTheme] = useState('light')
  const router = useRouter()

  useEffect(() => {
    try {
      const t =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('siteTheme')
      if (t === 'dark') setSiteTheme('dark')
      else setSiteTheme('light')
    } catch (e) {}
  }, [])

  function toggleSiteTheme() {
    const next = siteTheme === 'dark' ? 'light' : 'dark'
    setSiteTheme(next)
    try {
      if (next === 'dark') {
        document.documentElement.setAttribute('data-site-theme', 'dark')
        localStorage.setItem('siteTheme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-site-theme')
        localStorage.setItem('siteTheme', 'light')
      }
    } catch (e) {}
  }

  function handleSubmit(e) {
    e.preventDefault()
    const query = q.trim()
    if (!query) return

    // If page passes a custom handler, use it
    if (onSearch) {
      onSearch(query)
    } else {
      // Default: go to /chapters?q=...
      router.push(`/chapters?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <header
      className={
        'bg-white dark:bg-slate-900 border-b dark:border-slate-700 sticky top-0 z-40 transition-transform duration-200 ' +
        (isHidden ? '-translate-y-full pointer-events-none' : 'translate-y-0')
      }
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-14">
          <button
            aria-label="Open chapters"
            onClick={onOpenChapters}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:hidden"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-3">
            <div className="text-lg font-semibold">ATG</div>
          </Link>

          {/* SEARCH: now visible on mobile too */}
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chapter no or title..."
                className="w-full rounded-md border px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search chapters"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                  />
                </svg>
              </div>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSiteTheme}
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle site theme"
            >
              {siteTheme === 'dark' ? (
                // sun icon
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1M12 20v1M20 12h1M3 12H2M16.2 7.8l.7-.7M6.1 17.9l-.7.7M17.9 17.9l.7.7M6.1 6.1l-.7-.7"
                  />
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                </svg>
              ) : (
                // moon icon
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  />
                </svg>
              )}
            </button>

            <Link
              href="/bookmarks"
              className="hidden sm:inline-block text-sm text-blue-600"
            >
              Bookmarks
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
