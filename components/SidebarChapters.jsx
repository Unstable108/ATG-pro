import Link from 'next/link'

export default function SidebarChapters({ chapters = [], open=false, onClose }) {
  return (
    <>
      <aside className="hidden md:block w-72 shrink-0 border-r dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="sticky top-16">
          <h3 className="text-sm font-semibold mb-3">Chapters</h3>
          <ul className="space-y-2">
            {chapters.map(ch => (
              <li key={ch.slug}>
                <Link href={`/chapters/${ch.slug}`} className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800">
                  <div className="text-sm font-medium">Chapter {ch.chapterNumber}{ch.title ? ` — ${ch.title}` : ''}</div>
                  <div className="text-xs text-gray-500">{(ch.content || '').slice(0, 70)}{ch.content.length > 70 ? '...' : ''}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className={`md:hidden ${open ? 'slide-over open' : 'slide-over'}`} role="dialog" aria-modal="true" style={{ display: open ? 'flex' : 'none' }}>
        <div className="slide-over-backdrop" onClick={onClose} />
        <div className="slide-over-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Chapters</h3>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-md">
              ✕
            </button>
          </div>
          <ul className="space-y-3">
            {chapters.map(ch => (
              <li key={ch.slug}>
                <Link href={`/chapters/${ch.slug}`} className="block p-3 rounded hover:bg-gray-50 dark:hover:bg-slate-800" onClick={onClose}>
                  <div className="font-medium">Chapter {ch.chapterNumber}{ch.title ? ` — ${ch.title}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{(ch.content || '').slice(0, 80)}{ch.content.length > 80 ? '...' : ''}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
