// pages/chapters/index.js
import Link from 'next/link'
import TopBar from '../../components/TopBar'
import { getAllChapters } from '../../lib/chapters'

export default function ChaptersPage({ chapters }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <TopBar onOpenChapters={() => {}} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">All Chapters</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Browse every chapter of {`"${'My Novel'}"`} in order.
          </p>
        </header>

        <ul className="space-y-3">
          {chapters.map(ch => (
            <li key={ch.slug} className="p-3 border rounded bg-white dark:bg-slate-900 flex justify-between items-start">
              <div>
                <Link href={`/chapters/${ch.slug}`} className="block">
                  <div className="text-lg font-medium">
                    Chapter {ch.chapterNumber}{ch.title ? ` — ${ch.title}` : ''}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {(ch.content || '').slice(0, 140)}{(ch.content || '').length > 140 ? '...' : ''}
                  </div>
                </Link>
              </div>
              <div className="flex flex-col items-end">
                <Link href={`/chapters/${ch.slug}`} className="text-sm text-blue-600">Read →</Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export async function getStaticProps() {
  const chapters = getAllChapters().map(c => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    content: c.content,
  }))

  return { props: { chapters } }
}
