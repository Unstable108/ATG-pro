// pages/track.js
import { redis } from "../lib/redis"
import Link from "next/link"

export async function getServerSideProps() {
  // For a small site, KEYS is okay; if it grows huge we can switch to SCAN.
  const keys = await redis.keys("stats:*")

  const entries = await Promise.all(
    keys.map(async (key) => [key, await redis.get(key)])
  )

  const stats = Object.fromEntries(entries)

  return { props: { stats } }
}

export default function Track({ stats }) {
  // Convert to arrays & numbers
  const toNumber = (v) => (typeof v === "number" ? v : Number(v || 0))

  const totals = Object.entries(stats).filter(([k]) =>
    k.startsWith("stats:total:")
  )
  const countries = Object.entries(stats).filter(([k]) =>
    k.startsWith("stats:country:")
  )
  const paths = Object.entries(stats).filter(([k]) =>
    k.startsWith("stats:path:")
  )

  // Derive some summary metrics
  const totalViews =
    totals.find(([k]) => k === "stats:total:view")?.[1] || 0
  const totalEvents = totals.reduce(
    (sum, [, v]) => sum + toNumber(v),
    0
  )

  const sortedCountries = [...countries].sort(
    (a, b) => toNumber(b[1]) - toNumber(a[1])
  )
  const sortedPaths = [...paths].sort(
    (a, b) => toNumber(b[1]) - toNumber(a[1])
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <span>📊 ATG Analytics</span>
              <span className="text-xs font-normal text-slate-400 border border-slate-700 rounded-full px-2 py-0.5">
                internal
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Simple, privacy-friendly stats for{" "}
              <span className="font-mono text-slate-200">
                atg-pro.vercel.app
              </span>
            </p>
          </div>

          <Link
            href="/"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            ← Back to site
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Total views
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {toNumber(totalViews)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Counted per route change
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Total events
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {toNumber(totalEvents)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              All events (views, clicks, etc.)
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Unique event types
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {totals.length}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              e.g. view, next_click, prev_click
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Countries table */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Visits by country
              </h2>
              <span className="text-xs text-slate-500">
                header: x-vercel-ip-country
              </span>
            </div>
            {sortedCountries.length === 0 ? (
              <p className="text-sm text-slate-500">
                No country data yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="text-left py-2 pr-4">Country</th>
                      <th className="text-right py-2 pl-4">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCountries.map(([k, v]) => {
                      const code = k.replace("stats:country:", "") || "UNK"
                      const num = toNumber(v)
                      return (
                        <tr
                          key={k}
                          className="border-b border-slate-900/60 last:border-0"
                        >
                          <td className="py-1.5 pr-4">
                            <span className="font-mono text-slate-100">
                              {code}
                            </span>
                          </td>
                          <td className="py-1.5 pl-4 text-right">
                            {num}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Paths table */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Views by page
              </h2>
              <span className="text-xs text-slate-500">
                Based on router path
              </span>
            </div>
            {sortedPaths.length === 0 ? (
              <p className="text-sm text-slate-500">
                No page views tracked yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="text-left py-2 pr-4">Path</th>
                      <th className="text-right py-2 pl-4">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPaths.map(([k, v]) => {
                      const path = k.replace("stats:path:", "") || "/"
                      const num = toNumber(v)
                      return (
                        <tr
                          key={k}
                          className="border-b border-slate-900/60 last:border-0"
                        >
                          <td className="py-1.5 pr-4">
                            <span className="font-mono text-slate-100">
                              {path}
                            </span>
                          </td>
                          <td className="py-1.5 pl-4 text-right">
                            {num}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Raw totals section (debug / extra info) */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">
            Event breakdown
          </h2>
          {totals.length === 0 ? (
            <p className="text-sm text-slate-500">
              No events recorded yet.
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {totals.map(([k, v]) => {
                const name = k.replace("stats:total:", "")
                return (
                  <li key={k} className="flex justify-between">
                    <span className="font-mono text-slate-200">
                      {name}
                    </span>
                    <span className="text-slate-200">
                      {toNumber(v)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
