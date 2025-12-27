// pages/[novelSlug]/chapters/index.js
import { getAllChapters } from "../../../lib/chapters";
import { getNovel } from "../../../lib/novels";
import Link from "next/link";
import TopBar from "../../../components/TopBar";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import ChapterSearchToggle from "../../../components/ChapterSearchToggle";

export default function ChaptersPage({ novel, chapters, novelSlug }) {
  const router = useRouter();
  const currentSlug = router.query.novelSlug || 'atg';
  const basePath = currentSlug === 'atg' ? '' : `/${currentSlug}`;
  const [filtered, setFiltered] = useState(chapters);
  const [searchInfo, setSearchInfo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const qParam = router.query.q;
    if (!qParam) {
      // no query: show all chapters
      setFiltered(chapters);
      setSearchInfo("");
      setSearchQuery("");
      return;
    }

    const q = Array.isArray(qParam) ? qParam[0] : qParam;
    const trimmed = q.trim();
    if (!trimmed) {
      setFiltered(chapters);
      setSearchInfo("");
      setSearchQuery("");
      return;
    }

    // Try numeric search first (chapter number)
    const num = Number(trimmed);
    if (!Number.isNaN(num) && Number.isInteger(num) && num > 0) {
      const target = chapters.find(
        (c) => Number(c.chapterNumber) === num
      );
      const maxChapter = chapters.reduce(
        (max, c) =>
          Number(c.chapterNumber) > max ? Number(c.chapterNumber) : max,
        0
      );

      if (target) {
        // go directly to that chapter page
        router.replace(`${basePath}/chapters/${target.slug}`);
        return;
      } else {
        // go to the highest chapter available
        const last = chapters.reduce(
          (best, c) =>
            Number(c.chapterNumber) > Number(best.chapterNumber)
              ? c
              : best,
          chapters[0]
        );
        router.replace(`${basePath}/chapters/${last.slug}`);
        return;
      }
    }

    // Text search: match in title (and optionally chapterNumber as string)
    const lower = trimmed.toLowerCase();
    const list = chapters.filter((c) => {
      const title = (c.title || "").toLowerCase();
      return (
        title.includes(lower) || String(c.chapterNumber).includes(lower)
      );
    });

    setSearchQuery(trimmed);
    setFiltered(list);
    setSearchInfo(`Found ${list.length} chapter(s) for "${trimmed}"`);
  }, [router.isReady, router.query.q, chapters, basePath]);

  // current query string (for pre-filling the toggle input)
  const qParam = router.query.q;
  const currentQuery =
    typeof qParam === "string"
      ? qParam
      : Array.isArray(qParam)
      ? qParam[0]
      : "";

  // called when user presses Enter in the search box
  const handleSearchSubmit = (term) => {
    if (!term) {
      router.push(`${basePath}/chapters`);
    } else {
      router.push({
        pathname: `${basePath}/chapters`,
        query: { q: term },
      });
    }
  };

  // --- SEO ---
  const siteUrl = (typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : window.location.origin) || "http://localhost:3000";
  const metaTitle = `${novel?.title || "Against The Gods"} - All Chapters`;
  const metaDesc = `Browse all chapters of ${novel?.title || "Against The Gods"}. Jump by number or search by title.`;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
      </Head>

      <TopBar onOpenChapters={() => {}} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              All Chapters
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Browse every chapter, or use the search icon to jump by number
              or search by title.
            </p>
            {searchQuery && (
              <p className="mt-2 text-sm text-blue-600">{searchInfo}</p>
            )}
          </div>

          {/* 👉 Right-side search icon + expandable input */}
          <ChapterSearchToggle
            initialValue={currentQuery || ""}
            onSubmit={handleSearchSubmit}
            placeholder="Search by number or title..."
          />
        </header>

        <ul className="space-y-3">
          {filtered.map((ch) => (
            <li
              key={ch.slug}
              className="p-3 border rounded bg-white dark:bg-slate-900 flex justify-between items-start"
            >
              <div>
                <Link href={`${basePath}/chapters/${ch.slug}`} className="block">
                  <div className="text-lg font-medium">
                    Chapter {ch.chapterNumber}
                    {ch.title ? ` — ${ch.title}` : ""}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {(ch.excerpt || "").slice(0, 140)}
                    {(ch.excerpt || "").length > 140 ? "..." : ""}
                  </div>
                </Link>
              </div>
              <div className="flex flex-col items-end">
                <Link
                  href={`${basePath}/chapters/${ch.slug}`}
                  className="text-sm text-blue-600"
                >
                  Read →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export async function getStaticProps({ params, query }) {
  const { novelSlug = 'atg' } = params;
  const novel = await getNovel(novelSlug);
  if (!novel) return { notFound: true };

  let allChaps = await getAllChapters(novelSlug);
  let chapters = allChaps.map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    excerpt: (c.content || "").slice(0, 140),
  }));

  return { props: { novel, chapters, novelSlug }, revalidate: 86400 };
}

export async function getStaticPaths() {
  const { getNovels } = await import('../../../lib/novels');
  const novels = await getNovels();
  const paths = novels.map(novel => ({ params: { novelSlug: novel.slug } }));
  return { paths, fallback: 'blocking' };
}