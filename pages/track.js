// pages/track.js
import { redis } from "../lib/redis";
import Link from "next/link";
import Head from "next/head";
import { useMemo, useState, useEffect } from "react";

export async function getServerSideProps() {
  // If Redis isn't configured (e.g. local dev), return empty stats instead of crashing.
  if (!redis) {
    console.warn("[track] Redis not configured; returning empty stats");
    return { props: { stats: {} } };
  }

  // Use SCAN via scanIterator so we don't block Redis with KEYS on large datasets.
  const keys = [];
  for await (const key of redis.scanIterator({ match: "stats:*" })) {
    keys.push(key);
  }

  const entries = await Promise.all(
    keys.map(async (k) => [k, await redis.get(k)])
  );
  const raw = Object.fromEntries(entries);

  // Normalize: try parse JSON values, fallback to number/string
  const stats = {};
  for (const [k, v] of Object.entries(raw)) {
    let value = v;
    try {
      value = JSON.parse(v);
    } catch (e) {
      if (!Number.isNaN(Number(v))) value = Number(v);
    }
    // strip leading "stats:" so keys look like "path:/", "country:IN", "total:view"
    stats[k.replace(/^stats:/, "")] = value;
  }

  return { props: { stats } };
}


// safe numeric getter
function toNumber(v) {
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.reduce((a, b) => a + (Number(b) || 0), 0);
  if (typeof v === "object" && v !== null) {
    if (v.count) return Number(v.count);
    if (v.views) return Number(v.views);
    return Object.values(v).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export default function Track({ stats }) {
  const [snapshotTime, setSnapshotTime] = useState("");
  const [pathQuery, setPathQuery] = useState("");
  const [pathSortBy, setPathSortBy] = useState("views"); // views | path
  const [pathDir, setPathDir] = useState("desc"); // desc | asc

  useEffect(() => {
    // client-only timestamp to avoid hydration mismatch
    setSnapshotTime(new Date().toLocaleString());
  }, []);

  // Flatten all stats into rows once
  const allRows = useMemo(
    () =>
      Object.entries(stats).map(([k, v]) => ({
        key: k, // e.g. "path:/", "country:IN", "total:view"
        raw: v,
        views: toNumber(v),
      })),
    [stats]
  );

  const pathRows = useMemo(
    () =>
      allRows
        .filter((r) => r.key.startsWith("path:"))
        .map((r) => ({
          ...r,
          path: r.key.replace(/^path:/, "") || "/",
        })),
    [allRows]
  );

  const countryRows = useMemo(
    () =>
      allRows
        .filter((r) => r.key.startsWith("country:"))
        .map((r) => ({
          ...r,
          country: r.key.replace(/^country:/, "") || "UNK",
        })),
    [allRows]
  );

  const otherRows = useMemo(
    () =>
      allRows.filter(
        (r) => !r.key.startsWith("path:") && !r.key.startsWith("country:")
      ),
    [allRows]
  );

  const filteredPathRows = useMemo(() => {
    let rows = pathRows;
    if (pathQuery.trim()) {
      const q = pathQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.path.toLowerCase().includes(q) ||
          r.key.toLowerCase().includes(q)
      );
    }

    rows = [...rows].sort((a, b) => {
      if (pathSortBy === "views") {
        return pathDir === "desc" ? b.views - a.views : a.views - b.views;
      }
      if (pathSortBy === "path") {
        return pathDir === "desc"
          ? b.path.localeCompare(a.path)
          : a.path.localeCompare(b.path);
      }
      return 0;
    });

    return rows;
  }, [pathRows, pathQuery, pathSortBy, pathDir]);

  const sortedCountryRows = useMemo(
    () => [...countryRows].sort((a, b) => b.views - a.views),
    [countryRows]
  );

  const totalEvents = allRows.reduce((sum, r) => sum + r.views, 0);
  const totalKeys = allRows.length;

  function downloadCSV() {
    const header = ["key", "views", "raw"];
    const lines = [header.join(",")].concat(
      allRows.map((r) => {
        let raw = typeof r.raw === "string" ? r.raw : JSON.stringify(r.raw);
        raw = raw.replace(/"/g, '""');
        return [r.key, r.views, `"${raw}"`].join(",");
      })
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Head>
        <title>ATG Analytics — Track</title>
        <meta
          name="description"
          content="Analytics for ATG: view counts, events and quick exports"
        />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">📊 ATG Analytics</h1>
              <p className="text-sm text-slate-400 mt-1">
                Simple internal dashboard for views & events.
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={downloadCSV}
                className="px-3 py-1 rounded border bg-slate-800 hover:bg-slate-700"
              >
                Download CSV
              </button>
              <Link href="/" className="px-3 py-1 rounded border bg-transparent">
                Open site
              </Link>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Total events
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalEvents}</div>
              <div className="mt-1 text-xs text-slate-500">
                Sum of all keys
              </div>
            </div>

            <div className="p-4 rounded bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Tracked keys
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalKeys}</div>
              <div className="mt-1 text-xs text-slate-500">
                e.g. path:/..., country:IN, total:view
              </div>
            </div>

            <div className="p-4 rounded bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Snapshot time
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {snapshotTime || "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">Client time</div>
            </div>
          </div>

          {/* Views by page */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Views by page
              </h2>
              <div className="flex gap-2 items-center">
                <input
                  aria-label="Search paths"
                  value={pathQuery}
                  onChange={(e) => setPathQuery(e.target.value)}
                  placeholder="Search path..."
                  className="bg-slate-800 rounded px-3 py-1.5 text-sm"
                />
                <select
                  className="bg-slate-800 px-2 py-1.5 rounded text-sm"
                  value={pathSortBy}
                  onChange={(e) => setPathSortBy(e.target.value)}
                >
                  <option value="views">Sort: Views</option>
                  <option value="path">Sort: Path</option>
                </select>
                <button
                  onClick={() =>
                    setPathDir((d) => (d === "desc" ? "asc" : "desc"))
                  }
                  className="px-2.5 py-1.5 rounded bg-slate-800 text-xs"
                >
                  {pathDir === "desc" ? "Desc" : "Asc"}
                </button>
              </div>
            </div>

            {filteredPathRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                No page views tracked yet.
              </p>
            ) : (
              <div className="overflow-auto rounded-md border border-slate-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-2 text-xs text-slate-400">Path</th>
                      <th className="px-4 py-2 text-xs text-slate-400">
                        Views
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPathRows.map((r) => (
                      <tr
                        key={r.key}
                        className="border-b border-slate-800 last:border-0"
                      >
                        <td className="px-4 py-2 font-mono truncate max-w-xs">
                          {r.path}
                        </td>
                        <td className="px-4 py-2">{r.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Visits by country */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                Visits by country
              </h2>
              <span className="text-xs text-slate-500">
                header: x-vercel-ip-country
              </span>
            </div>

            {sortedCountryRows.length === 0 ? (
              <p className="text-sm text-slate-500">No country data yet.</p>
            ) : (
              <div className="overflow-auto rounded-md border border-slate-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-2 text-xs text-slate-400">
                        Country
                      </th>
                      <th className="px-4 py-2 text-xs text-slate-400">
                        Views
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCountryRows.map((r) => (
                      <tr
                        key={r.key}
                        className="border-b border-slate-800 last:border-0"
                      >
                        <td className="px-4 py-2 font-mono">{r.country}</td>
                        <td className="px-4 py-2">{r.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Other stats (totals, click events, etc.) */}
          <section className="mb-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Other stats / events
            </h2>
            {otherRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                No additional stats recorded yet.
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {otherRows.map((r) => (
                  <li
                    key={r.key}
                    className="flex justify-between gap-4 border-b border-slate-900/50 pb-1 last:border-0"
                  >
                    <span className="font-mono text-slate-200">{r.key}</span>
                    <span className="text-slate-200">{r.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-4 text-xs text-slate-500">
            Tip: stats keys follow this pattern:{" "}
            <code>stats:path:/...</code>, <code>stats:country:IN</code>,{" "}
            <code>stats:total:view</code>, etc.
          </div>
        </div>
      </div>
    </>
  );
}
