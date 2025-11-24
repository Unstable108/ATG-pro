// pages/api/sitemap.xml.js
import { getAllChapters } from "../../lib/chapters";

export default function handler(req, res) {
  const host = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
  const chapters = getAllChapters();
  // basic static pages
  const staticPages = ["/", "/chapters", "/admin", "/track"];

  const urls = [
    ...staticPages.map((p) => `${host}${p}`),
    ...chapters.map((c) => `${host}/chapters/${c.slug}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map((u) => {
        return `<url>
          <loc>${u}</loc>
          <changefreq>weekly</changefreq>
        </url>`;
      })
      .join("\n")}
  </urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(xml);
}
