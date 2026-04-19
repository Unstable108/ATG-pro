// pages/api/sitemap.xml.js
import { getAllChapters } from "../../lib/chapters";
import { getNovels } from "../../lib/novels";

export default async function handler(req, res) {
  const host = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
  const novels = await getNovels();

  const urls = [
    `${host}/`,
    `${host}/chapters`,
  ];

  for (const novel of novels) {
    const basePath = `${host}/${novel.slug}`;
    urls.push(basePath, `${basePath}/chapters`);

    const chapters = await getAllChapters(novel.slug);
    const latestChapters = chapters.slice(-20);
    latestChapters.forEach((chapter) => {
      urls.push(`${basePath}/chapters/${chapter.slug}`);
    });
  }

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
