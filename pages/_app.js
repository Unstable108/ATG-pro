// pages/_app.js
import Script from "next/script";
import Head from "next/head";
import "../styles/globals.css";
import { useEffect } from "react";


export default function App({ Component, pageProps }) {
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

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* <script defer src="https://umami-delta-amber.vercel.app/script.js" data-website-id="20971589-8fde-483d-97dd-1792d3a2a1f3"></script> */}
      </Head>
      <Script
        src="https://umami-delta-amber.vercel.app/script.js"
        data-website-id="20971589-8fde-483d-97dd-1792d3a2a1f3"
        strategy="afterInteractive"
      />
      <Component {...pageProps} />
      {/* <Analytics /> */}
    </>
  );
}
