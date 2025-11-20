// pages/chapters/[slug].js
import { getAllChapters, getChapterBySlug } from '../../lib/chapters'
import ReaderControls from '../../components/ReaderControls'
import Head from 'next/head'
import Link from 'next/link'
import { remark } from 'remark'
import html from 'remark-html'
import { useEffect, useRef, useState } from 'react'
import TopBar from '../../components/TopBar'
import SidebarChapters from '../../components/SidebarChapters'
import { useRouter } from 'next/router'

export default function Chapter({ chapterHtml, chapter, allChapters, prevSlug, nextSlug }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [chapOpen, setChapOpen] = useState(false)
  const router = useRouter()
  const articleRef = useRef(null)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' && window.localStorage.getItem('novelBookmarks')
      if (raw) {
        const items = JSON.parse(raw)
        setBookmarked(items.some(b => b.slug === chapter.slug))
      }
    } catch (e) {}
  }, [chapter.slug])

  useEffect(() => {
    // restore scroll position for this chapter
    try {
      const key = `progress:${chapter.slug}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const pct = Number(raw)
        if (!Number.isNaN(pct) && pct > 0) {
          const to = Math.round(document.body.scrollHeight * pct)
          window.scrollTo(0, to)
        }
      } else {
        // start at top for fresh reads
        window.scrollTo(0, 0)
      }
    } catch (e) {}
  }, [chapter.slug])

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement
      const scrollTop = window.scrollY || el.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0
      const bar = document.getElementById('read-progress-bar')
      if (bar) bar.style.width = `${Math.round(pct * 100)}%`
      try { localStorage.setItem(`progress:${chapter.slug}`, String(pct)) } catch (e) {}
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [chapter.slug])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft' && prevSlug) router.push(`/chapters/${prevSlug}`).then(() => window.scrollTo(0,0))
      if (e.key === 'ArrowRight' && nextSlug) router.push(`/chapters/${nextSlug}`).then(() => window.scrollTo(0,0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevSlug, nextSlug, router])

  function toggleBookmark() {
    try {
      const raw = typeof window !== 'undefined' && window.localStorage.getItem('novelBookmarks')
      let items = raw ? JSON.parse(raw) : []
      if (items.some(b => b.slug === chapter.slug)) {
        items = items.filter(b => b.slug !== chapter.slug)
        setBookmarked(false)
      } else {
        items.push({ slug: chapter.slug, title: chapter.title, chapterNumber: chapter.chapterNumber })
        setBookmarked(true)
      }
      localStorage.setItem('novelBookmarks', JSON.stringify(items))
    } catch (e) {}
  }

  // helper for client-side navigation: scroll to top after pushing route
  function navTo(slug) {
    router.push(`/chapters/${slug}`).then(() => {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div id="read-progress-bar" className="read-progress-bar" />
      <TopBar
        onOpenChapters={() => setChapOpen(true)}
        onToggleTheme={() => {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
          if (isDark) document.documentElement.removeAttribute('data-theme')
          else document.documentElement.setAttribute('data-theme', 'dark')
        }}
        onSearch={(q) => {}}
      />

      <div className="max-w-5xl mx-auto flex gap-6 px-4 sm:px-6 lg:px-8 py-6">
        <SidebarChapters chapters={allChapters} open={chapOpen} onClose={() => setChapOpen(false)} />

        <main className="flex-1">
          {/* Chapter header */}
          <div className="chapter-meta">
            <div className="novel-title" >Against The God</div>
            <div className="chapter-title">Chapter {chapter.chapterNumber}{chapter.title ? ` — ${chapter.title}` : ''}</div>
            <div className="chapter-subtitle">{chapter.publishedAt}</div>
          </div>

          {/* Inline prev/next under title (centered) */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {prevSlug ? (
              <button onClick={() => navTo(prevSlug)} className="px-3 py-2 rounded border btn">← Prev</button>
            ) : (
              <span className="px-3 py-2 rounded border opacity-40 btn">← Prev</span>
            )}
            {nextSlug ? (
              <button onClick={() => navTo(nextSlug)} className="px-3 py-2 rounded border btn">Next →</button>
            ) : (
              <span className="px-3 py-2 rounded border opacity-40 btn">Next →</span>
            )}
          </div>

          <div className="mb-4">
            <ReaderControls />
          </div>

          {/* Article */}
          <article ref={articleRef} className="reader-content bg-transparent rounded" aria-label={`Chapter ${chapter.chapterNumber}`}>
            <div dangerouslySetInnerHTML={{ __html: chapterHtml }} />
          </article>

          {/* Bottom inline prev/next links (like WuxiaWorld/Webnovel) */}
          <div className="mt-8 mb-12 text-center">
            <div className="flex items-center justify-center gap-6">
              {prevSlug ? (
                <button onClick={() => navTo(prevSlug)} className="px-4 py-2 rounded border btn">← Previous Chapter</button>
              ) : <span className="px-4 py-2 rounded border opacity-40">← Previous Chapter</span>}

              {nextSlug ? (
                <button onClick={() => navTo(nextSlug)} className="px-4 py-2 rounded border btn">Next Chapter →</button>
              ) : <span className="px-4 py-2 rounded border opacity-40">Next Chapter →</span>}
            </div>

            {/* small "jump to top" for very long chapters */}
            <div className="mt-3">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm underline">Jump to top</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export async function getStaticPaths() {
  const chapters = getAllChapters()
  const paths = chapters.map(c => ({ params: { slug: c.slug } }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const chapter = getChapterBySlug(params.slug)
  const processed = await remark().use(html).process(chapter.content || '')
  const chapterHtml = processed.toString()
  const allChapters = getAllChapters().map(c => ({ slug: c.slug, chapterNumber: c.chapterNumber, title: c.title, content: c.content }))
  const idx = allChapters.findIndex(c => c.slug === chapter.slug)
  let prevSlug = null, nextSlug = null
  if (idx > 0) prevSlug = allChapters[idx - 1].slug
  if (idx < allChapters.length - 1) nextSlug = allChapters[idx + 1].slug
  return { props: { chapterHtml, chapter, allChapters, prevSlug, nextSlug } }
}
