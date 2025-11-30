// pages/library.js
import { getNovels } from "../lib/novels";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

export default function Library({ novels }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Head>
        <title>Library - All Novels</title>
        <meta name="description" content="Browse our collection of webnovels" />
      </Head>
      <header className="border-b border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Novel Library</h1>
          <p className="text-lg text-gray-600 dark:text-slate-400">Discover and dive into epic stories</p>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {novels.map((novel) => {
            const basePath = novel.slug === 'atg' ? '' : `/${novel.slug}`; // Flat for ATG
            return (
              <Link key={novel.slug} href={basePath || '/atg'} className="block group">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative h-64">
                    <Image
                      src={novel.cover}
                      alt={`${novel.title} cover`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {novel.slug === 'atg' && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-2 line-clamp-1">{novel.title}</h2>
                    {novel.subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 line-clamp-1">{novel.subtitle}</p>}
                    <p className="text-gray-600 dark:text-slate-300 mb-4 line-clamp-2">{novel.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">By {novel.author}</span>
                      <span className="bg-blue-600 group-hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        Read Now
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {novels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">No novels yet—check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const novels = await getNovels();
  return { props: { novels }, revalidate: 3600 }; // Hourly refresh
}