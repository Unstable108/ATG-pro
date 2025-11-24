// pages/robots.txt.js

export async function getServerSideProps({ req, res }) {
  const hostEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const hostFromHeader = req ? `https://${req.headers.host}` : "";
  const baseUrl = hostEnv || hostFromHeader || "http://localhost:3000";

  const sitemapUrl = `${baseUrl.replace(/\/$/, "")}/api/sitemap.xml`;

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");

  res.setHeader("Content-Type", "text/plain");
  res.write(body);
  res.end();

  return {
    props: {},
  };
}

export default function Robots() {
  // This page is never rendered, it's only used to send the robots.txt content.
  return null;
}
