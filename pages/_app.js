// pages/_app.js
import Head from 'next/head'
import '../styles/globals.css'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // initialize site theme from localStorage (siteTheme = 'dark' | 'light')
    try {
      const siteTheme = typeof window !== 'undefined' && window.localStorage.getItem('siteTheme')
      if (siteTheme === 'dark') {
        document.documentElement.setAttribute('data-site-theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-site-theme')
      }
      // initialize reader theme variables from readerPrefs if present
      const raw = typeof window !== 'undefined' && window.localStorage.getItem('readerPrefs')
      if (raw) {
        try {
          const p = JSON.parse(raw)
          // apply font-size & family immediately
          if (p.fontSize) document.documentElement.style.setProperty('--reader-font-size', `${p.fontSize}px`)
          if (p.fontFamily) document.documentElement.style.setProperty('--reader-font-family', p.fontFamily)
          if (p.textColor) document.documentElement.style.setProperty('--reader-text-color', p.textColor)
          if (p.bgColor) document.documentElement.style.setProperty('--reader-bg-color', p.bgColor)
          // set reader theme attribute separate from site theme
          if (p.readerTheme) {
            document.documentElement.setAttribute('data-reader-theme', p.readerTheme)
          }
        } catch (e) {}
      }
    } catch (e) {}
  }, [])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
