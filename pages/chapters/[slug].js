// pages/chapters/[slug].js
import { getAllChapters, getChapterBySlug } from "../../lib/chapters";
import ReaderControls from "../../components/ReaderControls";
import Head from "next/head";
import Link from "next/link";
import { remark } from "remark";
import html from "remark-html";
import { useEffect, useRef, useState } from "react";
import TopBar from "../../components/TopBar";
import SidebarChapters from "../../components/SidebarChapters";
import { useRouter } from "next/router";

export default function Chapter({
  chapterHtml,
  chapter,
  allChapters,
  prevSlug,
  nextSlug,
  novel,
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [chapOpen, setChapOpen] = useState(false);
  const router = useRouter();
  const articleRef = useRef(null);

  // Hide/show top & bottom chrome on scroll
  const [chromeHidden, setChromeHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  // load bookmarked state
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" &&
        window.localStorage.getItem("novelBookmarks");
      if (raw) {
        const items = JSON.parse(raw);
        setBookmarked(items.some((b) => b.slug === chapter.slug));
      }
    } catch (e) {}
  }, [chapter.slug]);

  // restore scroll position for this chapter
  useEffect(() => {
    try {
      const key = `progress:${chapter.slug}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const pct = Number(raw);
        if (!Number.isNaN(pct) && pct > 0) {
          const to = Math.round(document.body.scrollHeight * pct);
          window.scrollTo(0, to);
        }
      } else {
        window.scrollTo(0, 0);
      }
    } catch (e) {}
  }, [chapter.slug]);

  // reading progress bar + save progress
  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrollTop = window.scrollY || el.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
      const bar = document.getElementById("read-progress-bar");
      if (bar) bar.style.width = `${Math.round(pct * 100)}%`;
      try {
        localStorage.setItem(`progress:${chapter.slug}`, String(pct));
      } catch (e) {}
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    // set initial bar width
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter.slug]);

  // chrome hide/show on scroll direction
  useEffect(() => {
    function handleScrollDirection() {
      const current = window.scrollY || 0;
      const last = lastScrollYRef.current;
      const delta = current - last;

      // scrolling up or near top -> show chrome
      if (current < 80 || delta < -10) {
        setChromeHidden(false);
      } else if (delta > 10 && current > 80) {
        // scrolling down a bit -> hide chrome
        setChromeHidden(true);
      }
      lastScrollYRef.current = current;
    }

    window.addEventListener("scroll", handleScrollDirection, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDirection);
  }, []);

  // keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft" && prevSlug)
        router.push(`/chapters/${prevSlug}`).then(() => window.scrollTo(0, 0));
      if (e.key === "ArrowRight" && nextSlug)
        router.push(`/chapters/${nextSlug}`).then(() => window.scrollTo(0, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevSlug, nextSlug, router]);

  function toggleBookmark() {
    try {
      const raw =
        typeof window !== "undefined" &&
        window.localStorage.getItem("novelBookmarks");
      let items = raw ? JSON.parse(raw) : [];
      if (items.some((b) => b.slug === chapter.slug)) {
        items = items.filter((b) => b.slug !== chapter.slug);
        setBookmarked(false);
      } else {
        items.push({
          slug: chapter.slug,
          title: chapter.title,
          chapterNumber: chapter.chapterNumber,
        });
        setBookmarked(true);
      }
      localStorage.setItem("novelBookmarks", JSON.stringify(items));
    } catch (e) {}
  }

  // --- analytics: small helper to track clicks
  function trackClick(event, path, meta) {
    if (typeof window === "undefined") return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, path, meta }),
    }).catch(() => {});
  }

  // helper for client-side navigation: scroll to top after pushing route
  function navTo(slug) {
    router.push(`/chapters/${slug}`).then(() => {
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // --- analytics: wrappers for tracked nav actions
  function handlePrev() {
    if (!prevSlug) return;
    trackClick("prev_click", `/chapters/${prevSlug}`, {
      fromChapter: chapter.slug,
    });
    navTo(prevSlug);
  }

  function handleNext() {
    if (!nextSlug) return;
    trackClick("next_click", `/chapters/${nextSlug}`, {
      fromChapter: chapter.slug,
    });
    navTo(nextSlug);
  }

  // ---------------- SEO bits ----------------
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonicalPath = `/chapters/${chapter.slug}`;
  const fullUrl = `${siteUrl}${canonicalPath}`;

  const baseTitle = novel?.title || "Against The Gods";
  const metaTitle = `${baseTitle} - Chapter ${
    chapter.chapterNumber
  }${chapter.title ? `: ${chapter.title}` : ""} | Webnovel Reader`;

  const excerpt =
    (chapter.excerpt && chapter.excerpt.slice(0, 155)) ||
    (chapterHtml
      ? chapterHtml.replace(/<[^>]+>/g, "").slice(0, 155)
      : novel?.description || "");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "@id": `${fullUrl}#chapter`,
    url: fullUrl,
    name: `${baseTitle} - Chapter ${chapter.chapterNumber}${
      chapter.title ? `: ${chapter.title}` : ""
    }`,
    position: chapter.chapterNumber,
    description: excerpt,
    isPartOf: {
      "@type": "Book",
      "@id": `${siteUrl}#book`,
      name: baseTitle,
    },
    author: {
      "@type": "Person",
      name: novel?.author || "Author",
    },
  };
  // ------------------------------------------

  return (
    <div className="min-h-screen">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={excerpt} />
        <meta
          name="keywords"
          content={`Against the Gods chapter ${chapter.chapterNumber}, ATG chapter ${chapter.chapterNumber}, ${baseTitle} latest chapter, ${baseTitle} webnovel`}
        />

        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={excerpt} />
        {novel?.cover && (
          <meta property="og:image" content={novel.cover} />
        )}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={fullUrl} />

        <meta name="twitter:card" content="summary_large_image" />

        <link rel="canonical" href={fullUrl} />

        <script
          type="application/ld+json"
          // safe because it's just structured data
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </Head>

      <div id="read-progress-bar" className="read-progress-bar" />

      <TopBar
        onOpenChapters={() => setChapOpen(true)}
        isHidden={chromeHidden}
      />

      <div className="max-w-6xl mx-auto flex gap-6 px-1 sm:px-6 lg:px-8 py-6">
        <SidebarChapters
          chapters={allChapters}
          open={chapOpen}
          onClose={() => setChapOpen(false)}
          currentSlug={chapter.slug}
        />

        <main className="flex-1">
          {/* Chapter header */}
          <div className="chapter-meta">
            {/* NOVEL TITLE AS LINK TO HOMEPAGE */}
            <div className="novel-title">
              <Link href="/" className="hover:underline font-semibold">
                {novel?.title || "Against The God"}
              </Link>
            </div>

            <div className="chapter-title">
              Chapter {chapter.chapterNumber}
              {chapter.title ? ` — ${chapter.title}` : ""}
            </div>
            <div className="chapter-subtitle">{chapter.publishedAt}</div>
          </div>

          {/* Inline prev/next under title (centered) */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {prevSlug ? (
              <button
                onClick={handlePrev} // --- analytics: tracked
                className="px-3 py-2 rounded border btn"
              >
                ← Prev
              </button>
            ) : (
              <span className="px-3 py-2 rounded border opacity-40 btn">
                ← Prev
              </span>
            )}
            {nextSlug ? (
              <button
                onClick={handleNext} // --- analytics: tracked
                className="px-3 py-2 rounded border btn"
              >
                Next →
              </button>
            ) : (
              <span className="px-3 py-2 rounded border opacity-40 btn">
                Next →
              </span>
            )}
          </div>

          <div className="mb-4">
            <ReaderControls showMobileControls={!chromeHidden} />
          </div>

          {/* Article */}
          <article
            ref={articleRef}
            key={chapter.slug}
            className="reader-content reader-fade"
            aria-label={`Chapter ${chapter.chapterNumber}`}
          >
            <div dangerouslySetInnerHTML={{ __html: chapterHtml }} />
          </article>

          {/* Bottom inline prev/next links */}
          <div className="mt-8 mb-12 text-center">
            <div className="flex items-center justify-center gap-6">
              {prevSlug ? (
                <button
                  onClick={handlePrev} // --- analytics: tracked
                  className="px-4 py-2 rounded border btn"
                >
                  ← Previous Chapter
                </button>
              ) : (
                <span className="px-4 py-2 rounded border opacity-40">
                  ← Previous Chapter
                </span>
              )}

              {nextSlug ? (
                <button
                  onClick={handleNext} // --- analytics: tracked
                  className="px-4 py-2 rounded border btn"
                >
                  Next Chapter →
                </button>
              ) : (
                <span className="px-4 py-2 rounded border opacity-40">
                  Next Chapter →
                </span>
              )}
            </div>

            <div className="mt-3">
              <button
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="text-sm underline"
              >
                Jump to top
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const chapters = getAllChapters();
  const paths = chapters.map((c) => ({ params: { slug: c.slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const chapter = getChapterBySlug(params.slug);
  const processed = await remark().use(html).process(chapter.content || "");
  const chapterHtml = processed.toString();

  const allChapters = getAllChapters().map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    content: c.content,
  }));

  const idx = allChapters.findIndex((c) => c.slug === chapter.slug);
  let prevSlug = null,
    nextSlug = null;
  if (idx > 0) prevSlug = allChapters[idx - 1].slug;
  if (idx < allChapters.length - 1) nextSlug = allChapters[idx + 1].slug;

  // SERVER-ONLY: load novel.json using fs/path
  let novel = {
    title: "Against The God",
    subtitle: "",
    cover: "/covers/against-the-gods-novel.jpg",
    author: "Author",
    description: "",
    longDescription: "",
  };
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(process.cwd(), "content", "novel.json");
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      novel = JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }

  return {
    props: { chapterHtml, chapter, allChapters, prevSlug, nextSlug, novel },
  };
}
