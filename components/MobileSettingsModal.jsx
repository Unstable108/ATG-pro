import { useEffect, useState } from 'react'

export default function MobileSettingsModal({ open, onClose }) {
  const [fontSize, setFontSize] = useState(18)
  const [theme, setTheme] = useState('day') // day, night, sepia

  useEffect(() => {
    const saved = typeof window !== 'undefined' && window.localStorage.getItem('readerPrefs')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        if (p.fontSize) setFontSize(p.fontSize)
        if (p.dark) setTheme('night')
        else if (p.bgColor && p.bgColor === '#f5ecd8') setTheme('sepia')
        else setTheme('day')
      } catch {}
    }
  }, [open])

  function applyTheme(t) {
    let prefs = { fontSize, fontFamily: undefined, textColor: undefined, bgColor: undefined, dark: false }
    if (t === 'day') {
      prefs.dark = false; prefs.bgColor = '#ffffff'; prefs.textColor = '#111827'
    } else if (t === 'night') {
      prefs.dark = true; prefs.bgColor = '#0f172a'; prefs.textColor = '#e5e7eb'
    } else if (t === 'sepia') {
      prefs.dark = false; prefs.bgColor = '#f5ecd8'; prefs.textColor = '#111827'
    }
    const existingRaw = typeof window !== 'undefined' && window.localStorage.getItem('readerPrefs')
    let existing = existingRaw ? JSON.parse(existingRaw) : {}
    const merged = { ...existing, ...prefs, fontSize }
    localStorage.setItem('readerPrefs', JSON.stringify(merged))
    document.documentElement.style.setProperty('--reader-font-size', `${merged.fontSize}px`)
    document.documentElement.style.setProperty('--reader-text-color', merged.textColor)
    document.documentElement.style.setProperty('--reader-bg-color', merged.bgColor)
    if (merged.dark) document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    onClose && onClose()
  }

  function saveSize() {
    const existingRaw = typeof window !== 'undefined' && window.localStorage.getItem('readerPrefs')
    let existing = existingRaw ? JSON.parse(existingRaw) : {}
    existing.fontSize = fontSize
    localStorage.setItem('readerPrefs', JSON.stringify(existing))
    document.documentElement.style.setProperty('--reader-font-size', `${fontSize}px`)
    onClose && onClose()
  }

  if (!open) return null
  return (
    <div className="mobile-settings-modal" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reader Settings</h3>
          <button onClick={onClose} className="p-2 rounded">Close</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Font size</label>
            <input type="range" min={14} max={32} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full mt-2" />
            <div className="text-sm mt-1">{fontSize}px</div>
            <div className="mt-2">
              <button onClick={saveSize} className="px-3 py-2 rounded bg-blue-600 text-white">Apply size</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Theme presets</label>
            <div className="flex gap-2">
              <button onClick={() => applyTheme('day')} className="px-3 py-2 rounded border">Day</button>
              <button onClick={() => applyTheme('night')} className="px-3 py-2 rounded border">Night</button>
              <button onClick={() => applyTheme('sepia')} className="px-3 py-2 rounded border">Sepia</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
