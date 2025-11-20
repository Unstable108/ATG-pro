// components/ReaderControls.jsx
import { useEffect, useState } from 'react'
import MobileSettingsModal from './MobileSettingsModal'

const FONT_FAMILIES = [
  { id: 'sans', label: 'Sans', css: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial` },
  { id: 'serif', label: 'Serif', css: `Georgia,"Times New Roman",Times,serif` },
  { id: 'mono', label: 'Mono', css: `ui-monospace,SFMono-Regular,Menlo,Monaco,"Roboto Mono",monospace` },
]

export default function ReaderControls({ showMobileControls = true }) {
  const [fontSize, setFontSize] = useState(18)
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].css)
  const [textColor, setTextColor] = useState('#111827')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [readerTheme, setReaderTheme] = useState('day') // 'day' | 'night' | 'sepia'
  const [modalOpen, setModalOpen] = useState(false)

  // load prefs from localStorage
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' && window.localStorage.getItem('readerPrefs')
      if (saved) {
        const p = JSON.parse(saved)
        if (p.fontSize) setFontSize(p.fontSize)
        if (p.fontFamily) setFontFamily(p.fontFamily)
        if (p.textColor) setTextColor(p.textColor)
        if (p.bgColor) setBgColor(p.bgColor)
        if (p.readerTheme) setReaderTheme(p.readerTheme)
      }
    } catch (e) {}
  }, [])

  // apply prefs to CSS vars scoped to reader and persist
  useEffect(() => {
    // set CSS variables used by .reader-content (these are reader-scoped variables)
    document.documentElement.style.setProperty('--reader-font-size', `${fontSize}px`)
    document.documentElement.style.setProperty('--reader-font-family', fontFamily)
    document.documentElement.style.setProperty('--reader-text-color', textColor)
    document.documentElement.style.setProperty('--reader-bg-color', bgColor)

    // set a data attribute to indicate reader theme (so CSS can use selectors)
    try {
      document.documentElement.setAttribute('data-reader-theme', readerTheme)
    } catch (e) {}

    localStorage.setItem('readerPrefs', JSON.stringify({ fontSize, fontFamily, textColor, bgColor, readerTheme }))
  }, [fontSize, fontFamily, textColor, bgColor, readerTheme])

  return (
    <>
      {/* Desktop toolbar */}
      <div className="hidden sm:block p-3 bg-gray-50 dark:bg-slate-800 rounded-md shadow-sm">
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2">
            <span className="text-sm">Font</span>
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="rounded border px-2 py-1">
              {FONT_FAMILIES.map(f => <option key={f.id} value={f.css}>{f.label}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm">Size</span>
            <input type="range" min={14} max={32} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
            <span className="w-8 text-right">{fontSize}px</span>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-sm">Theme</span>
            <button
              onClick={() => { setReaderTheme('day'); setBgColor('#ffffff'); setTextColor('#111827') }}
              className="px-2 py-1 rounded border text-sm"
            >
              Day
            </button>
            <button
              onClick={() => { setReaderTheme('night'); setBgColor('#0f172a'); setTextColor('#e5e7eb') }}
              className="px-2 py-1 rounded border text-sm"
            >
              Night
            </button>
            <button
              onClick={() => { setReaderTheme('sepia'); setBgColor('#f5ecd8'); setTextColor('#111827') }}
              className="px-2 py-1 rounded border text-sm"
            >
              Sepia
            </button>
          </label>

          <div className="ml-auto">
            <button
              onClick={() => {
                setFontSize(18)
                setFontFamily(FONT_FAMILIES[0].css)
                setTextColor('#111827')
                setBgColor('#ffffff')
                setReaderTheme('day')
              }}
              className="px-3 py-1 rounded border"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom toolbar */}
      {showMobileControls && (
        <div className="sm:hidden fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 w-[92%]">
          <div className="reader-controls-mobile bg-white dark:bg-slate-900 rounded-xl p-2 shadow-lg flex items-center justify-between">
            <button
              aria-label="Open settings"
              onClick={() => setModalOpen(true)}
              className="px-3 py-2 rounded"
            >
              A
            </button>

            <button
              aria-label="Reader theme toggle"
              onClick={() => setReaderTheme(readerTheme === 'night' ? 'day' : 'night')}
              className="px-3 py-2 rounded"
            >
              {readerTheme === 'night' ? '🌙' : '☀️'}
            </button>

            <button
              aria-label="Width"
              onClick={() => {
                const cur = document.documentElement.style.getPropertyValue('--reader-max-width') || ''
                if (cur === '720px') document.documentElement.style.setProperty('--reader-max-width', '100%')
                else document.documentElement.style.setProperty('--reader-max-width', '720px')
              }}
              className="px-3 py-2 rounded"
            >
              W
            </button>

            <button
              onClick={() => {
                setFontSize(18)
                setFontFamily(FONT_FAMILIES[0].css)
                setTextColor('#111827')
                setBgColor('#ffffff')
                setReaderTheme('day')
              }}
              className="px-3 py-2 rounded"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="reader-bottom-space" />
      <MobileSettingsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
