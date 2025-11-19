import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    const raw = typeof window !== 'undefined' && window.localStorage.getItem('novelBookmarks')
    if (raw) {
      try { setBookmarks(JSON.parse(raw)) } catch (e) { setBookmarks([]) }
    }
  }, [])

  function remove(slug) {
    const updated = bookmarks.filter(b => b.slug !== slug)
    setBookmarks(updated)
    localStorage.setItem('novelBookmarks', JSON.stringify(updated))
  }

  if (!bookmarks || bookmarks.length === 0) return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="mt-4 text-sm text-gray-600">No bookmarks yet. While reading a chapter, click the bookmark button to save your place.</p>
        <Link href="/" className="text-blue-600 mt-4 inline-block">← Back to chapters</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <ul className="mt-4 space-y-3">
          {bookmarks.map(b => (
            <li key={b.slug} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">Chapter {b.chapterNumber}{b.title ? ` — ${b.title}` : ''}</div>
                <div className="text-sm text-gray-500">{b.slug}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/chapters/${b.slug}`} className="text-blue-600">Open</Link>
                <button className="text-sm text-red-600" onClick={() => remove(b.slug)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
