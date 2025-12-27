// pages/[novelSlug]/index.js
import Link from "next/link";
import TopBar from "../../components/TopBar";
import SidebarChapters from "../../components/SidebarChapters";
import Image from "next/image";
import { getAllChapters } from "../../lib/chapters";
import { getNovel } from "../../lib/novels";
import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ChapterSearchToggle from "../../components/ChapterSearchToggle";
import ChapterList from "../../components/ChapterList"; // NEW: Import the component

export default function Home({ novel, chapters, novelSlug }) {
  const router = useRouter();
  const currentSlug = router.query.novelSlug || 'atg'; // Client-side fallback
  const basePath = currentSlug === 'atg' ? '' : `/${currentSlug}`; // Flat for ATG, prefixed for others
  const latest = [...chapters].slice(-2).reverse(); // latest 2, newest first

  // Client-side state for continue reading
  const [continueItem, setContinueItem] = useState(null);

  // sort order state (true = ascending, false = descending)
  const [sortAsc, setSortAsc] = useState(true);

  // derive sorted chapters for the "All Chapters" list
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = Number(a.chapterNumber) || 0;
    const bNum = Number(b.chapterNumber) || 0;
    return sortAsc ? aNum - bNum : bNum - aNum;
  });

  useEffect(() => {
    try {
      // Find the chapter with the highest saved progress > 0
      const map = {};
      chapters.forEach((c) => {
        try {
          const raw = localStorage.getItem(`progress:${currentSlug}:${c.slug}`);
          if (raw) {
            const pct = Number(raw);
            if (!Number.isNaN(pct) && pct > 0) map[c.slug] = pct;
          }
        } catch (e) {}
      });
      const entries = Object.entries(map);
      if (entries.length > 0) {
        // choose the chapter with the highest percent
        entries.sort((a, b) => b[1] - a[1]);
        const chosenSlug = entries[0][0];
        const pct = Math.round(entries[0][1] * 100);
        const chapter = chapters.find((c) => c.slug === chosenSlug);
        if (chapter)
          setContinueItem({
            slug: chapter.slug,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            pct,
          });
      }
    } catch (e) {
      // ignore
    }
  }, [chapters, currentSlug]);

  // --- SEO bits ---
  const siteUrl =
    (typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL
      : window.location.origin) || "http://localhost:3000";

  const siteTitle = novel?.title || "Against The Gods";
  const metaTitle = `${siteTitle} Webnovel | Read Latest Chapters Online`;
  const metaDesc =
    novel?.description ||
    `${siteTitle} webnovel – read the latest translated chapters of Against The Gods online, including high chapter numbers and recent releases.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: siteTitle,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}${basePath}/chapters?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Book",
        "@id": `${siteUrl}#book`,
        name: siteTitle,
        url: siteUrl,
        author: {
          "@type": "Person",
          name: novel?.author || "Author",
        },
        image: novel?.cover ? `${siteUrl}${novel.cover}` : undefined,
        description: novel?.description || metaDesc,
      },
    ],
  };

  // called when user presses Enter in home-page search box
  const handleHomeSearchSubmit = (term) => {
    if (!term) {
      router.push(`${basePath}/chapters`);
    } else {
      router.push({
        pathname: `${basePath}/chapters`,
        query: { q: term },
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta
          name="keywords"
          content="Against the Gods, ATG,against the god chapter 2000, against the god new chapters, Against the God novel new chapter, Against the God novel chapters , webnovel, latest chapter, Against the Gods chapter list, Against the Gods English translation"
        />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        {novel?.cover && (
          <meta property="og:image" content={`${siteUrl}${novel.cover}`} />
        )}
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index,follow" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <TopBar onOpenChapters={() => {}} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HERO */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-10">
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="w-56 md:w-64 shadow-lg rounded overflow-hidden">
              <Image
                src={novel.cover}
                alt={`${novel.title} cover`}
                width={640}
                height={900}
                style={{ width: "100%", height: "auto" }}
                priority
              />
            </div>

            {/* Continue reading card (small, under cover) */}
            {continueItem ? (
              <div className="mt-4 w-full bg-white dark:bg-slate-800 p-3 border rounded shadow-sm text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">
                      Continue reading
                    </div>
                    <Link
                      href={`${basePath}/chapters/${continueItem.slug}`}
                      className="font-medium"
                    >
                      Chapter {continueItem.chapterNumber}
                      {continueItem.title ? ` — ${continueItem.title}` : ""}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-600">
                    {continueItem.pct}%
                  </div>
                </div>
                <div className="mt-2">
                  <Link
                    href={`${basePath}/chapters/${continueItem.slug}`}
                    className="inline-block bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Open
                  </Link>
                  <button
                    className="ml-2 text-xs text-red-600"
                    onClick={() => {
                      localStorage.removeItem(`progress:${currentSlug}:${continueItem.slug}`);
                      setContinueItem(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 w-full text-center text-sm text-gray-500">
                No in-progress chapters yet
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {novel.title}
            </h1>
            {novel.subtitle ? (
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                {novel.subtitle}
              </div>
            ) : null}
            <div className="prose max-w-none dark:prose-invert mb-4">
              <p className="text-base md:text-lg">{novel.description}</p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href={latest.length ? `${basePath}/chapters/${latest[0].slug}` : "/"}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Read Latest
              </Link>
              <Link
                href={`${basePath}/chapters`}
                className="inline-block border px-4 py-2 rounded-md text-sm"
              >
                All Chapters
              </Link>
              <div className="text-sm text-gray-500 ml-auto">
                Author: {novel.author}
              </div>
            </div>

            {novel.longDescription ? (
              <div className="mt-6 text-sm text-gray-700 dark:text-slate-300">
                <p>{novel.longDescription}</p>
              </div>
            ) : null}
          </div>
        </section>

        {/* NEW RELEASE CARD (Replaces "Latest Chapters") - Highlighted & Gap Closed */}
        {latest.length > 0 && (
          <section className="mb-2"> {/* Reduced from mb-10 */}
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between shadow-md"> {/* Fuller bg + shadow */}
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">New Release</span>
                <h3 className="mt-1 text-slate-900 dark:text-slate-100 font-semibold">
                  Chapter {latest[0].chapterNumber}: {latest[0].title || `Chapter ${latest[0].chapterNumber}`}
                </h3>
              </div>
              <Link
                href={`${basePath}/chapters/${latest[0].slug}`}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors whitespace-nowrap"
              >
                Read Now
              </Link>
            </div>
            {/* <div className="mt-4 text-right">
              <Link href={`${basePath}/chapters`} className="text-sm text-blue-600 hover:underline">
                See all chapters →
              </Link>
            </div> */}
          </section>
        )}

        {/* PAGINATED CHAPTER LIST (Replaces old "All Chapters" ul) */}
        <section>
          <div className="flex items-center justify-between mb-4 gap-3">
            {/* <h2 className="text-xl font-semibold">All Chapters</h2> */}

            {/* 👉 Search icon + expanding box */}
            {/* <div className="flex items-center gap-2">
              <ChapterSearchToggle
                onSubmit={handleHomeSearchSubmit}
                placeholder="Jump by number or title..."
              />
            </div> */}
          </div>

          {/* NEW: Paginated List */}
          <ChapterList
            chapters={sortedChapters}
            sortAsc={sortAsc}
            basePath={basePath}
            onSortToggle={() => setSortAsc((prev) => !prev)}
          />
        </section>
      </main>
    </div>
  );
}

export async function getStaticPaths() {
  const { getNovels } = await import('../../lib/novels');
  const novels = await getNovels();
  const paths = novels.map(novel => ({ params: { novelSlug: novel.slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const { novelSlug = 'atg' } = params; // Fallback for /
  let novel = {
    title: "Against The Gods",
    subtitle: "逆天邪神",
    cover: "/covers/against-the-gods-novel.jpg",
    author: "MARS",
    description: "Reading MARS Creation",
    longDescription: "Hunted for possessing a heaven-defying object, Yun Che is a young man in both that life and the next. ",
  };
  try {
    novel = await getNovel(novelSlug);
  } catch (e) {
    console.error("Failed to read novel.json", e);
  }

  // IMPORTANT: only send a short excerpt, not full content
  const allChaps = await getAllChapters(novelSlug);
  const chapters = allChaps.map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    excerpt: (c.content || "").slice(0, 400),
  }));

  return { props: { novel, chapters, novelSlug }, revalidate: 86400 };
}