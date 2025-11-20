// components/ReaderControls.jsx
import { useEffect, useState } from "react";

const FONT_FAMILIES = [
  {
    id: "sans",
    label: "Sans",
    css: `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial`,
  },
  {
    id: "serif",
    label: "Serif",
    css: `Georgia,"Times New Roman",Times,serif`,
  },
  {
    id: "mono",
    label: "Mono",
    css: `ui-monospace,SFMono-Regular,Menlo,Monaco,"Roboto Mono",monospace`,
  },
];

export default function ReaderControls({ showMobileControls = true }) {
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].css);
  const [readerTheme, setReaderTheme] = useState("day"); // "day" | "night" | "sepia"

  // Load prefs on mount
  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined" &&
        window.localStorage.getItem("readerPrefs");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.fontSize) setFontSize(p.fontSize);
        if (p.fontFamily) setFontFamily(p.fontFamily);
        if (p.readerTheme) setReaderTheme(p.readerTheme);
      }
    } catch (e) {}
  }, []);

  // Apply + persist
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--reader-font-size",
        `${fontSize}px`
      );
      document.documentElement.setAttribute("data-reader-theme", readerTheme);
    }

    try {
      localStorage.setItem(
        "readerPrefs",
        JSON.stringify({ fontSize, fontFamily, readerTheme })
      );
    } catch (e) {}
  }, [fontSize, fontFamily, readerTheme]);

  function resetAll() {
    setFontSize(18);
    setFontFamily(FONT_FAMILIES[0].css);
    setReaderTheme("day");
  }

  return (
    <>
      {/* Desktop toolbar */}
      <div className="hidden sm:block p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-sm mb-3 text-slate-900 dark:text-slate-100">
        <div className="flex gap-3 items-center flex-wrap">
          {/* Font family */}
          <label className="flex items-center gap-2">
            <span className="text-sm">Font</span>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 px-2 py-1"
              style={{ fontFamily }}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.id} value={f.css}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          {/* Font size */}
          <label className="flex items-center gap-2">
            <span className="text-sm">Size</span>
            <input
              type="range"
              min={14}
              max={32}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="accent-blue-600"
            />
            <span className="w-8 text-right text-xs">{fontSize}px</span>
          </label>

          {/* Theme buttons */}
          <div className="flex items-center gap-1">
            <span className="text-sm mr-1">Theme</span>
            <button
              type="button"
              onClick={() => setReaderTheme("day")}
              className={
                "px-2 py-1 rounded border text-xs " +
                (readerTheme === "day"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600")
              }
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setReaderTheme("night")}
              className={
                "px-2 py-1 rounded border text-xs " +
                (readerTheme === "night"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600")
              }
            >
              Night
            </button>
            <button
              type="button"
              onClick={() => setReaderTheme("sepia")}
              className={
                "px-2 py-1 rounded border text-xs " +
                (readerTheme === "sepia"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600")
              }
            >
              Sepia
            </button>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={resetAll}
              className="px-3 py-1 rounded border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom toolbar */}
      {showMobileControls && (
        <div className="sm:hidden fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 w-[92%]">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-lg flex items-center justify-between border border-slate-200 dark:border-slate-700">
            {/* Font size +/- */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Decrease font"
                onClick={() => setFontSize((f) => Math.max(14, f - 1))}
                className="px-2 py-1 rounded border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
              >
                A-
              </button>
              <button
                type="button"
                aria-label="Increase font"
                onClick={() => setFontSize((f) => Math.min(32, f + 1))}
                className="px-2 py-1 rounded border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
              >
                A+
              </button>
            </div>

            {/* Theme toggle day/night */}
            <button
              type="button"
              aria-label="Toggle reader theme"
              onClick={() =>
                setReaderTheme(readerTheme === "night" ? "day" : "night")
              }
              className="px-3 py-1 rounded border text-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
            >
              {readerTheme === "night" ? "🌙" : "☀️"}
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={resetAll}
              className="px-3 py-1 rounded border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </>
  );
}
