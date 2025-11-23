// pages/track.js
import { redis } from "../lib/redis"

export async function getServerSideProps() {
  // For small sites, KEYS is fine. If it grows big, we can switch to SCAN.
  const keys = await redis.keys("stats:*")

  const entries = await Promise.all(
    keys.map(async (key) => [key, await redis.get(key)])
  )

  const stats = Object.fromEntries(entries)

  return { props: { stats } }
}

export default function Track({ stats }) {
  const total = Object.entries(stats).filter(([k]) =>
    k.startsWith("stats:total:")
  )
  const countries = Object.entries(stats).filter(([k]) =>
    k.startsWith("stats:country:")
  )
  const paths = Object.entries(stats).filter(([k]) =>
    k.startsWith("stats:path:")
  )

  return (
    <div style={{ padding: "24px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: 16 }}>
        📊 ATG Analytics
      </h1>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "18px", marginBottom: 8 }}>Total Events</h2>
        <ul>
          {total.map(([k, v]) => (
            <li key={k}>
              <strong>{k.replace("stats:total:", "")}</strong>: {v}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "18px", marginBottom: 8 }}>
          Views by Country
        </h2>
        <ul>
          {countries.map(([k, v]) => (
            <li key={k}>
              {k.replace("stats:country:", "")}: {v}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: "18px", marginBottom: 8 }}>Views by Page</h2>
        <ul>
          {paths.map(([k, v]) => (
            <li key={k}>
              {k.replace("stats:path:", "")}: {v}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
