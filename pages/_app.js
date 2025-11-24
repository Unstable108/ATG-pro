// pages/_app.js
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import "../styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router"; // --- analytics: added

// --- analytics: small helper to send events to /api/track
function track(event = "view", path = "/", meta) {
  if (typeof window === "undefined") return;
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, path, meta }),
  }).catch(() => {});
}

export default function App({ Component, pageProps }) {
  const router = useRouter(); // --- analytics: added

  useEffect(() => {
    // initialize site theme from localStorage (siteTheme = 'dark' | 'light')
    try {
      const siteTheme =
        typeof window !== "undefined" &&
        window.localStorage.getItem("siteTheme");
      if (siteTheme === "dark") {
        document.documentElement.setAttribute("data-site-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-site-theme");
      }
      // initialize reader theme variables from readerPrefs if present
      const raw =
        typeof window !== "undefined" &&
        window.localStorage.getItem("readerPrefs");
      if (raw) {
        try {
          const p = JSON.parse(raw);
          // apply font-size & family immediately
          if (p.fontSize)
            document.documentElement.style.setProperty(
              "--reader-font-size",
              `${p.fontSize}px`
            );
          if (p.fontFamily)
            document.documentElement.style.setProperty(
              "--reader-font-family",
              p.fontFamily
            );
          if (p.textColor)
            document.documentElement.style.setProperty(
              "--reader-text-color",
              p.textColor
            );
          if (p.bgColor)
            document.documentElement.style.setProperty(
              "--reader-bg-color",
              p.bgColor
            );
          // set reader theme attribute separate from site theme
          if (p.readerTheme) {
            document.documentElement.setAttribute(
              "data-reader-theme",
              p.readerTheme
            );
          }
        } catch (e) {}
      }
    } catch (e) {}
  }, []);

  // --- analytics: track page views on route change
  useEffect(() => {
    function handleRouteChange(url) {
      track("view", url);
    }

    // initial load
    if (typeof window !== "undefined") handleRouteChange(router.asPath);

    // on client-side route changes
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <meta name="theme-color" content="#0f172a" />
        {/* ✅ Favicon support */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
