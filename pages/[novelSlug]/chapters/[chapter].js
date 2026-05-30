// pages/[novelSlug]/chapters/[chapter].js
import { getAllChapters, getChapterBySlug } from "../../../lib/chapters";
import { getNovel } from "../../../lib/novels";
import ReaderControls from "../../../components/ReaderControls";
import Head from "next/head";
import Link from "next/link";
import { remark } from "remark";
import html from "remark-html";
import { useEffect, useRef, useState } from "react";
import TopBar from "../../../components/TopBar";
import SidebarChapters from "../../../components/SidebarChapters";
import { useRouter } from "next/router";
import DisqusComments from "../../../components/DisqusComments";

export default function Chapter({
  chapterHtml,
  chapter,
  allChapters,
  prevSlug,
  nextSlug,
  novel,
  novelSlug,
}) {
  const [bookmarked, setBookmarked] = useState(false);
  const [chapOpen, setChapOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const currentSlug = router.query.novelSlug || "atg";
  const basePath = currentSlug === "atg" ? "" : `/${currentSlug}`;
  const articleRef = useRef(null);
  
  const [chromeHidden, setChromeHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  // 1. Format the Novel Title safely
  const novelTitle = typeof novelSlug === 'string' 
    ? novelSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Loading...';

  // 2. Get the Chapter Title safely directly from the object properties
  const chapterTitle = chapter?.title || `Chapter ${chapter?.chapterNumber || 'Unknown'}`;

  // load bookmarked state
  useEffect(() => {
    if (!chapter?.slug) return;
    try {
      const raw =
        typeof window !== "undefined" &&
        window.localStorage.getItem("novelBookmarks");
      if (raw) {
        const items = JSON.parse(raw);
        setBookmarked(
          items.some(
            (b) => b.slug === chapter.slug && b.novelSlug === currentSlug
          )
        );
      }
    } catch (e) {}
  }, [chapter?.slug, currentSlug]);

  // restore scroll position for this chapter
  useEffect(() => {
    if (!chapter?.slug) return;
    try {
      const key = `progress:${currentSlug}:${chapter.slug}`;
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
  }, [chapter?.slug, currentSlug]);

  // reading progress bar + save progress
  useEffect(() => {
    if (!chapter?.slug) return;
    function onScroll() {
      const el = document.documentElement;
      const scrollTop = window.scrollY || el.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
      const bar = document.getElementById("read-progress-bar");
      if (bar) bar.style.width = `${Math.round(pct * 100)}%`;
      try {
        localStorage.setItem(
          `progress:${currentSlug}:${chapter.slug}`,
          String(pct)
        );
      } catch (e) {}
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter?.slug, currentSlug]);

  // chrome hide/show on scroll direction
  useEffect(() => {
    function handleScrollDirection() {
      if (isMenuOpen) return;

      const current = window.scrollY || 0;
      const last = lastScrollYRef.current;
      const delta = current - last;

      if (current < 80 || delta < -10) {
        setChromeHidden(false);
      } else if (delta > 10 && current > 80) {
        setChromeHidden(true);
      }
      lastScrollYRef.current = current;
    }

    window.addEventListener("scroll", handleScrollDirection, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDirection);
  }, [isMenuOpen]); 

  const handleMenuToggle = (open) => {
    setIsMenuOpen(open);
    if (open) {
      setChromeHidden(false); 
    }
  };

  const handleToggleChapters = () => {
    setChapOpen((prev) => !prev);
  };

  // keyboard navigation
  useEffect(() => {
    function isTypingTarget(el) {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      if (!tag) return false;
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement;
      if (isTypingTarget(active)) return;

      const key = e.key.toLowerCase();
      if ((key === "arrowleft" || key === "arrowleft") && prevSlug) {
        e.preventDefault();
        navTo(prevSlug);
      } else if ((key === "arrowright" || key === "arrowright") && nextSlug) {
        e.preventDefault();
        navTo(nextSlug);
      } else if (key === "j" && prevSlug) {
        e.preventDefault();
        navTo(prevSlug);
      } else if (key === "k" && nextSlug) {
        e.preventDefault();
        navTo(nextSlug);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevSlug, nextSlug, basePath]);

  function toggleBookmark() {
    if (!chapter?.slug) return;
    try {
      const raw =
        typeof window !== "undefined" &&
        window.localStorage.getItem("novelBookmarks");
      let items = raw ? JSON.parse(raw) : [];
      if (
        items.some(
          (b) => b.slug === chapter.slug && b.novelSlug === currentSlug
        )
      ) {
        items = items.filter(
          (b) => !(b.slug === chapter.slug && b.novelSlug === currentSlug)
        );
        setBookmarked(false);
      } else {
        items.push({
          novelSlug: currentSlug,
          slug: chapter.slug,
          title: chapter.title,
          chapterNumber: chapter.chapterNumber,
        });
        setBookmarked(true);
      }
      localStorage.setItem("novelBookmarks", JSON.stringify(items));
    } catch (e) {}
  }

  function navTo(slug) {
    router.push(`${basePath}/chapters/${slug}`).then(() => {
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function handlePrev() {
    if (!prevSlug) return;
    navTo(prevSlug);
  }

  function handleNext() {
    if (!nextSlug) return;
    navTo(nextSlug);
  }

  // Safety check before rendering content
  if (!chapter || !novelSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading Chapter Data...</div>
      </div>
    );
  }

  // ---------------- SEO bits ----------------
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonicalPath = `${basePath}/chapters/${chapter.slug}`;
  const fullUrl = `${siteUrl}${canonicalPath}`;

  const baseTitle = novel?.title || "Against The Gods";
  const metaTitle = `${baseTitle} - Chapter ${chapter.chapterNumber}${
    chapter.title ? `: ${chapter.title}` : ""
  } | ATG Novel`;

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
          <meta property="og:image" content={`${siteUrl}${novel.cover}`} />
        )}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={fullUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={fullUrl} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </Head>

      <div id="read-progress-bar" className="read-progress-bar" />

      <TopBar isHidden={chromeHidden} onMenuToggle={handleMenuToggle} />

      <div className="max-w-6xl mx-auto flex gap-6 px-1 sm:px-6 lg:px-8 py-6">
        <SidebarChapters
          chapters={allChapters}
          open={chapOpen}
          onClose={() => setChapOpen(false)}
          currentSlug={chapter.slug}
          basePath={basePath}
        />

        <main className="flex-1">
          <div className="chapter-meta">
            <div className="novel-title">
              <Link
                href={basePath || "/"}
                className="hover:underline font-semibold"
              >
                {novel?.title || "Against The Gods"}
              </Link>
            </div>

            <div className="chapter-title">
              Chapter {chapter.chapterNumber}
              {chapter.title ? ` — ${chapter.title}` : ""}
            </div>
            <div className="chapter-subtitle">{chapter.publishedAt}</div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            {prevSlug ? (
              <button onClick={handlePrev} className="px-3 py-2 rounded border btn">
                ← Prev
              </button>
            ) : (
              <span className="px-3 py-2 rounded border opacity-40 btn">← Prev</span>
            )}
            {nextSlug ? (
              <button onClick={handleNext} className="px-3 py-2 rounded border btn">
                Next →
              </button>
            ) : (
              <span className="px-3 py-2 rounded border opacity-40 btn">Next →</span>
            )}
          </div>

          <div className="mb-4">
            <ReaderControls
              showMobileControls={!chromeHidden}
              onToggleChapters={handleToggleChapters}
              onPrevChapter={handlePrev}
              onNextChapter={handleNext}
              hasPrev={!!prevSlug}
              hasNext={!!nextSlug}
            />
          </div>

          <article
            ref={articleRef}
            key={chapter.slug}
            className="reader-content reader-fade"
            aria-label={`Chapter ${chapter.chapterNumber}`}
          >
            <div dangerouslySetInnerHTML={{ __html: chapterHtml }} />
          </article>

          <div className="mt-8 mb-12 text-center">
            <div className="flex items-center justify-center gap-6">
              {prevSlug ? (
                <button onClick={handlePrev} className="px-4 py-2 rounded border btn">
                  ← Previous Chapter
                </button>
              ) : (
                <span className="px-4 py-2 rounded border opacity-40">
                  ← Previous Chapter
                </span>
              )}

              {nextSlug ? (
                <button onClick={handleNext} className="px-4 py-2 rounded border btn">
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
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-sm underline"
              >
                Jump to top
              </button>
            </div>
          </div>

          {/* 💬 Comments Section Wrapper */}
          <DisqusComments 
            id={`novel-${novelSlug}-ch-${chapter.slug}`} 
            title={`${novelTitle} - ${chapterTitle}`}
            path={`/${novelSlug}/chapters/${chapter.slug}`}
          />
        </main>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const { getNovels } = await import("../../../lib/novels");
  const novels = await getNovels();
  const paths = [];
  for (const novel of novels) {
    const chaps = await getAllChapters(novel.slug);
    paths.push(
      ...chaps.map((ch) => ({
        params: { novelSlug: novel.slug, chapter: ch.slug },
      }))
    );
  }
  return { paths, fallback: "blocking" };
}

export async function getStaticProps({ params }) {
  const { novelSlug = "atg", chapter: chapterSlug } = params;
  const novel = await getNovel(novelSlug);
  if (!novel) return { notFound: true };

  const chapter = await getChapterBySlug(novelSlug, chapterSlug);
  if (!chapter) return { notFound: true };

  const processed = await remark()
    .use(html)
    .process(chapter.content || "");
  const chapterHtml = processed.toString();

  const allChaps = (await getAllChapters(novelSlug)).map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
  }));

  const idx = allChaps.findIndex((c) => c.slug === chapterSlug);
  let prevSlug = null,
    nextSlug = null;
  if (idx > 0) prevSlug = allChaps[idx - 1].slug;
  if (idx < allChaps.length - 1) nextSlug = allChaps[idx + 1].slug;

  return {
    props: {
      chapterHtml,
      chapter,
      allChapters: allChaps,
      prevSlug,
      nextSlug,
      novel,
      novelSlug,
    },
    revalidate: 86400,
  };
}