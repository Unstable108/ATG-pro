// components/MobileSettingsModal.jsx
import { useEffect, useState } from 'react';

const FONT_FAMILIES = [
  { id: 'expo', label: 'Expo', css: '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { id: 'sans', label: 'Sans', css: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { id: 'serif', label: 'Serif', css: 'Georgia, Cambria, "Times New Roman", Times, serif' },
];

export default function MobileSettingsModal({ open, onClose }) {
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('expo');
  const [lineHeight, setLineHeight] = useState(1.6);
  const [isDark, setIsDark] = useState(false); // Sync to site dark mode
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem('readerPrefs');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.fontSize) setFontSize(p.fontSize);
        if (p.fontFamily && FONT_FAMILIES.find(f => f.id === p.fontFamily)) setFontFamily(p.fontFamily);
        if (p.lineHeight) setLineHeight(p.lineHeight);
      }
      // Sync dark mode from site
      setIsDark(document.documentElement.classList.contains('dark'));
    } catch {}
  }, [open, mounted]);

  function applyTheme(dark) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const prefs = { fontSize, fontFamily, lineHeight };
    localStorage.setItem('readerPrefs', JSON.stringify(prefs));

    // Apply CSS vars
    root.style.setProperty('--reader-font-size', `${fontSize}px`);
    const selectedFont = FONT_FAMILIES.find(f => f.id === fontFamily)?.css || FONT_FAMILIES[0].css;
    root.style.setProperty('--reader-font-family', selectedFont);
    root.style.setProperty('--reader-line-height', lineHeight);

    // Sync site dark class (no custom colors)
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setIsDark(dark);
    onClose?.();
  }

  if (!open || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full max-w-sm rounded-lg p-6 ${isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reader Settings</h3>
          <button onClick={onClose} className="p-2 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Size</label>
            <input
              type="range"
              min={12}
              max={32}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-sm mt-1 text-center">{fontSize}px</div>
          </div>

          {/* Line Height */}
          <div>
            <label className="block text-sm font-medium mb-2">Line Height</label>
            <input
              type="range"
              min={1.2}
              max={2.0}
              step={0.1}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-sm mt-1 text-center">{lineHeight.toFixed(1)}x</div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium mb-2">Font</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    fontFamily === f.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  } ${f.id === 'serif' ? 'font-serif' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggles (Day/Night only) */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => applyTheme(false)}
                className={`flex-1 px-3 py-2 rounded border ${
                  !isDark
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => applyTheme(true)}
                className={`flex-1 px-3 py-2 rounded border ${
                  isDark
                    ? 'border-blue-500 bg-blue-50 dark:bg-slate-700 text-blue-700'
                    : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                }`}
              >
                Night
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
            <button
              onClick={() => {
                setFontSize(16);
                setFontFamily('expo');
                setLineHeight(1.6);
                applyTheme(false); // Reset to day
              }}
              className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}