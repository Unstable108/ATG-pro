// pages/library.js
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import TopBar from "../components/TopBar";

import { getNovels, getNovel } from "../lib/novels";
import { getAllChapters } from "../lib/chapters";

export default function Library({ novels }) {
  const hasNovels = Array.isArray(novels) && novels.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Head>
        <title>Celestial Pavilion</title>
        <meta
          name="description"
          content="Browse all available webnovels and jump to their latest chapters."
        />
      </Head>

      <TopBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Library
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
              Pick a novel to start reading, or jump straight to the latest chapter.
            </p>
          </div>
          {hasNovels && (
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-slate-400">
              {novels.length} novel{novels.length > 1 ? "s" : ""} available
            </p>
          )}
        </header>

        {/* Novel list */}
        {hasNovels ? (
          <section className="space-y-4 sm:space-y-5">
            {novels.map((novel, index) => {
              const { slug, cover, title, subtitle, author, description, latestChapterNumber, latestChapterSlug } = novel;

              const basePath = slug === "atg" ? "" : `/${slug}`; // flat for ATG
              const detailHref = basePath || "/atg";
              const latestHref = latestChapterSlug
                ? `${basePath}/chapters/${latestChapterSlug}`
                : detailHref;

              return (
                <article
                  key={slug}
                  className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                    {/* Cover — smaller on mobile */}
                    <Link
                      href={detailHref}
                      className="relative w-24 sm:w-32 md:w-40 aspect-[2.5/4] rounded-md overflow-hidden shrink-0"
                    >
                      <Image
                        src={cover}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 480px) 96px, (max-width: 768px) 140px, 180px"
                        priority={index === 0} // slightly faster first card
                      />
                      {slug === "atg" && (
                        <span className="absolute top-1.5 left-1.5 bg-blue-600 text-[9px] px-1.5 py-0.5 rounded text-white font-semibold shadow">
                          Featured
                        </span>
                      )}
                    </Link>

                    {/* Info block */}
                    <div className="flex-1 flex flex-col justify-center gap-1.5">
                      <Link href={detailHref}>
                        <h2 className="font-semibold text-base sm:text-lg md:text-xl leading-tight line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {title}
                        </h2>
                      </Link>

                      {subtitle && (
                        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 line-clamp-1">
                          {subtitle}
                        </p>
                      )}

                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400">
                        By <span className="font-medium">{author}</span>
                      </p>

                      {/* Description shorter on mobile */}
                      {description && (
                        <p className="text-[11px] sm:text-sm text-gray-700 dark:text-slate-300 line-clamp-1 sm:line-clamp-2">
                          {description}
                        </p>
                      )}

                      {/* Latest chapter badge */}
                      <div className="flex items-center gap-2 mt-1">
                        {latestChapterNumber ? (
                          <Link
                            href={latestHref}
                            className="text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400"
                          >
                            Latest:
                            <span className="ml-1 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                              Ch. {latestChapterNumber}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">No chapters</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              No novels yet — check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getStaticProps() {
  try {
    // 1. Base list from content/novels.json
    const baseNovels = await getNovels();

    // 2. Enrich with novel metadata + latest chapter info
    const novels = await Promise.all(
      baseNovels.map(async (n) => {
        let novelMeta = {};
        let chapters = [];

        try {
          novelMeta = await getNovel(n.slug);
        } catch (e) {
          console.error(`Failed to read novel.json for ${n.slug}`, e);
        }

        try {
          chapters = await getAllChapters(n.slug);
        } catch (e) {
          console.error(`Failed to read chapters for ${n.slug}`, e);
        }

        // extra safety: ensure chapters sorted by chapterNumber ascending
        if (Array.isArray(chapters)) {
          chapters.sort((a, b) => {
            const aNum = Number(a.chapterNumber) || 0;
            const bNum = Number(b.chapterNumber) || 0;
            return aNum - bNum;
          });
        }

        const chapterCount = chapters.length;
        const latest = chapterCount > 0 ? chapters[chapterCount - 1] : null;

        return {
          slug: n.slug,
          path: n.path,
          title: novelMeta.title || n.title,
          subtitle: novelMeta.subtitle || "",
          cover: novelMeta.cover || "/covers/placeholder.jpg", // TODO: ensure placeholder exists
          author: novelMeta.author || "Unknown author",
          description: novelMeta.description || "",
          chapterCount,
          latestChapterNumber: latest?.chapterNumber || null,
          latestChapterSlug: latest?.slug || null,
        };
      })
    );

    return {
      props: { novels },
      revalidate: 3600, // refresh hourly
    };
  } catch (e) {
    console.error("Failed to build library page", e);
    return {
      props: { novels: [] },
      revalidate: 3600,
    };
  }
}
