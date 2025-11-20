// pages/index.js
import Link from "next/link";
import TopBar from "../components/TopBar";
import SidebarChapters from "../components/SidebarChapters";
import Image from "next/image";
import { getAllChapters } from "../lib/chapters";
import fs from "fs";
import path from "path";
import { useEffect, useState } from "react";

export default function Home({ novel, chapters }) {
  const latest = [...chapters].slice(-4).reverse(); // latest 4, newest first

  // Client-side state for continue reading
  const [continueItem, setContinueItem] = useState(null);

  // NEW: sort order state (true = ascending, false = descending)
  const [sortAsc, setSortAsc] = useState(true);

  // NEW: derive sorted chapters for the "All Chapters" list
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
          const raw = localStorage.getItem(`progress:${c.slug}`);
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
  }, [chapters]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
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
                      href={`/chapters/${continueItem.slug}`}
                      className="font-medium"
                    >
                      Chapter {continueItem.chapterNumber}
                      {continueItem.title
                        ? ` — ${continueItem.title}`
                        : ""}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-600">
                    {continueItem.pct}%
                  </div>
                </div>
                <div className="mt-2">
                  <Link
                    href={`/chapters/${continueItem.slug}`}
                    className="inline-block bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Open
                  </Link>
                  <button
                    className="ml-2 text-xs text-red-600"
                    onClick={() => {
                      localStorage.removeItem(
                        `progress:${continueItem.slug}`
                      );
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
                href={latest.length ? `/chapters/${latest[0].slug}` : "/"}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Read Latest
              </Link>
              <Link
                href="/chapters"
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

        {/* LATEST CHAPTERS */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Latest Chapters</h2>
            <Link href="/chapters" className="text-sm text-blue-600">
              See all chapters
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.map((ch) => (
              <article
                key={ch.slug}
                className="p-4 border rounded hover:shadow-sm bg-white dark:bg-slate-800"
              >
                <div className="text-sm text-gray-500 mb-1">
                  Chapter {ch.chapterNumber}
                </div>
                <Link href={`/chapters/${ch.slug}`} className="block">
                  <div className="font-medium">
                    {ch.title || `Chapter ${ch.chapterNumber}`}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 line-clamp-3">
                    {(ch.content || "").slice(0, 160)}
                    {(ch.content || "").length > 160 ? "..." : ""}
                  </div>
                </Link>
                <div className="mt-3">
                  <Link
                    href={`/chapters/${ch.slug}`}
                    className="text-sm text-blue-600"
                  >
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CHAPTER LIST */}
        <section>
          {/* NEW: header + sort toggle on opposite corner */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Chapters</h2>
            <button
              type="button"
              onClick={() => setSortAsc((prev) => !prev)}
              className="inline-flex items-center gap-1 text-sm border px-3 py-1 rounded-md text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-slate-800"
              aria-label="Toggle chapter sort order"
            >
              <span>{sortAsc ? "Ascending" : "Descending"}</span>
              <span className="text-xs">{sortAsc ? "↑" : "↓"}</span>
            </button>
          </div>

          <ul className="space-y-3">
            {sortedChapters.map((ch) => (
              <li
                key={ch.slug}
                className="p-3 border rounded flex justify-between items-start bg-white dark:bg-slate-900"
              >
                <div>
                  <Link href={`/chapters/${ch.slug}`} className="block">
                    <div className="text-lg font-medium">
                      Chapter {ch.chapterNumber}
                      {ch.title ? ` — ${ch.title}` : ""}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {(ch.content || "").slice(0, 140)}
                      {(ch.content || "").length > 140 ? "..." : ""}
                    </div>
                  </Link>
                </div>
                <div className="flex flex-col items-end">
                  <Link
                    href={`/chapters/${ch.slug}`}
                    className="text-sm text-blue-600"
                  >
                    Read →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  let novel = {
    title: "My Novel",
    subtitle: "",
    cover: "/covers/cover.jpg",
    author: "Author",
    description: "",
    longDescription: "",
  };
  try {
    const file = path.join(process.cwd(), "content", "novel.json");
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf8");
      novel = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read novel.json", e);
  }

  const chapters = getAllChapters().map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    content: c.content,
  }));
  return { props: { novel, chapters } };
}
