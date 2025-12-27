// pages/404.js
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import TopBar from "../components/TopBar";
import { getAllChapters } from "../lib/chapters";

export default function Custom404({ latestChapter }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = (query || "").trim();
    if (!trimmed) return;
    // Use existing /chapters search logic (handles numeric + text)
    router.push(`/chapters?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Head>
        <title>Page not found | Against The God</title>
        <meta name="robots" content="noindex" />
      </Head>

      <TopBar onOpenChapters={() => {}} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">404</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
            Lost in the God Realm
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            The page you are looking for doesn&apos;t exist. Maybe you took a
            wrong teleportation array?
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {latestChapter && (
            <div className="flex flex-col items-center space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You can jump back into the story:
              </p>
              <Link
                href={`/chapters/${latestChapter.slug}`}
                className="inline-flex items-center px-4 py-2 rounded-md border border-blue-500 text-blue-600 text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                Go to latest chapter &mdash; Chapter{" "}
                {latestChapter.chapterNumber}
                {latestChapter.title ? `: ${latestChapter.title}` : ""}
              </Link>
            </div>
          )}

          <div className="mt-10">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 text-center">
              Or search for a chapter by number or title:
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1, 50, Yun Che..."
                className="w-full sm:w-64 rounded-md border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Search
              </button>
            </form>
            <p className="mt-3 text-xs text-center text-slate-500">
              Hint: typing a chapter number (like <strong>50</strong>) will go
              straight to that chapter if it exists.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              Back to homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const allChaps = await getAllChapters('atg'); // Await + slug
  const chapters = allChaps.map((c) => ({ // Or whatever your map does
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
  }));
  if (!chapters || chapters.length === 0) {
    return { props: { latestChapter: null }, revalidate: 86400 };
  }
  // Your reduce logic here (e.g., grouping or summary)
  const chapterSummary = chapters.reduce((acc, ch) => {
    // Example: acc.total += 1; etc.
    return acc;
  }, { total: 0 });

  // pick the chapter with the highest chapterNumber
  const latest = chapters.reduce((best, c) => {
    if (!best) return c;
    const a = Number(best.chapterNumber) || 0;
    const b = Number(c.chapterNumber) || 0;
    return b > a ? c : best;
  });

  const latestChapter = {
    slug: latest.slug,
    chapterNumber: latest.chapterNumber,
    title: latest.title || "",
  };

  return { props: { chapters, chapterSummary, latestChapter }, revalidate: 86400 };
}
