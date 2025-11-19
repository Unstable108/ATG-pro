import Link from 'next/link'
import { getAllChapters } from '../lib/chapters'
import TopBar from '../components/TopBar'
import SidebarChapters from '../components/SidebarChapters'
import { useState, useEffect } from 'react'

export default function Home({ chapters }) {
  const [chapOpen, setChapOpen] = useState(false)
  const [filtered, setFiltered] = useState(chapters)
  const [progressMap, setProgressMap] = useState({})

  useEffect(() => {
    // load progress for all chapters from localStorage
    const map = {}
    try {
      chapters.forEach(c => {
        const raw = localStorage.getItem(`progress:${c.slug}`)
        if (raw) {
          const pct = Number(raw)
          if (!Number.isNaN(pct) && pct > 0) map[c.slug] = pct
        }
      })
    } catch (e) {}
    setProgressMap(map)
  }, [chapters])

  function handleSearch(q) {
    if (!q) return setFiltered(chapters)
    const lower = q.toLowerCase()
    setFiltered(chapters.filter(c => (c.title || '').toLowerCase().includes(lower) || (c.content || '').toLowerCase().includes(lower)))
  }

  return (
    <div>
      <TopBar onOpenChapters={() => setChapOpen(true)} onToggleTheme={() => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
        if (isDark) document.documentElement.removeAttribute('data-theme')
        else document.documentElement.setAttribute('data-theme', 'dark')
      }} onSearch={handleSearch} />

      <div className="max-w-5xl mx-auto flex gap-6 px-4 sm:px-6 lg:px-8 py-6">
        <SidebarChapters chapters={chapters} open={chapOpen} onClose={() => setChapOpen(false)} />

        <main className="flex-1">
          <header className="mb-6">
            <h1 className="text-3xl font-bold">My Novel</h1>
            <p className="text-sm text-gray-600">A simple reader for my personal novel. Chapters listed by number.</p>
          </header>

          <main>
            <ul className="space-y-3">
              {filtered.map(ch => (
                <li key={ch.slug} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <Link href={`/chapters/${ch.slug}`} className="block">
                      <div className="text-lg font-medium">Chapter {ch.chapterNumber}{ch.title ? ` — ${ch.title}` : ''}</div>
                      <div className="text-sm text-gray-500 mt-1">{(ch.content || '').slice(0, 120)}{ch.content.length > 120 ? '...' : ''}</div>
                    </Link>
                    {progressMap[ch.slug] ? (
                      <div className="mt-2 text-sm text-gray-500">Continue: {Math.round(progressMap[ch.slug]*100)}% read</div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end">
                    {progressMap[ch.slug] ? <div className="text-xs text-gray-500 mb-2">In progress</div> : <div className="text-xs text-gray-500 mb-2">&nbsp;</div>}
                    <Link href={`/chapters/${ch.slug}`} className="text-sm text-blue-600">Read →</Link>
                  </div>
                </li>
              ))}
            </ul>
          </main>
        </main>
      </div>
    </div>
  )
}

export async function getStaticProps() {
  const chapters = getAllChapters().map(c => ({ slug: c.slug, chapterNumber: c.chapterNumber, title: c.title, content: c.content }))
  return { props: { chapters } }
}
