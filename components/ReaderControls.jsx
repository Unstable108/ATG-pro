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

export default function ReaderControls({
  showMobileControls = true,
  onToggleChapters, // mobile hamburger
  onPrevChapter, // callback to go to previous chapter
  onNextChapter, // callback to go to next chapter
  hasPrev = false,
  hasNext = false,
}) {
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].css);
  const [sepiaOn, setSepiaOn] = useState(false);

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
        if (typeof p.sepiaOn === "boolean") setSepiaOn(p.sepiaOn);
      }
    } catch (e) {}
  }, []);

  // Apply + persist
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--reader-font-size", `${fontSize}px`);

      if (sepiaOn) {
        root.classList.add("sepia");
      } else {
        root.classList.remove("sepia");
      }
    }

    try {
      localStorage.setItem(
        "readerPrefs",
        JSON.stringify({ fontSize, fontFamily, sepiaOn })
      );
    } catch (e) {}
  }, [fontSize, fontFamily, sepiaOn]);

  function resetAll() {
    setFontSize(18);
    setFontFamily(FONT_FAMILIES[0].css);
    setSepiaOn(false);
  }

  // button classes
  const navBtnClass = (enabled) =>
    `px-3 py-1 rounded border text-sm font-medium ${
      enabled
        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800"
        : "bg-transparent text-gray-400 border border-transparent cursor-not-allowed opacity-50"
    } flex items-center justify-center`;

  const ChevronLeft = ({ className = "h-4 w-4" }) => (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 16L7 10l5-6" />
    </svg>
  );

  const ChevronRight = ({ className = "h-4 w-4" }) => (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 4l5 6-5 6" />
    </svg>
  );

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

          {/* Sepia toggle */}
          <button
            type="button"
            onClick={() => setSepiaOn((v) => !v)}
            className={
              "px-3 py-1 rounded border text-xs flex items-center gap-1 " +
              (sepiaOn
                ? "bg-amber-200 border-amber-400 text-amber-900"
                : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600")
            }
            aria-pressed={sepiaOn}
          >
            <span>{sepiaOn ? "Sepia on" : "Sepia off"}</span>
          </button>

          {/* Prev / Next in desktop toolbar (chevrons) */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous chapter"
              onClick={() => hasPrev && onPrevChapter?.()}
              disabled={!hasPrev}
              className={navBtnClass(hasPrev)}
            >
              <ChevronLeft />
            </button>

            <button
              type="button"
              aria-label="Next chapter"
              onClick={() => hasNext && onNextChapter?.()}
              disabled={!hasNext}
              className={navBtnClass(hasNext)}
            >
              <ChevronRight />
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
                className="px-2 py-1 rounded border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
              >
                A-
              </button>
              <button
                type="button"
                aria-label="Increase font"
                onClick={() => setFontSize((f) => Math.min(32, f + 1))}
                className="px-2 py-1 rounded border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
              >
                A+
              </button>
            </div>

            {/* Hamburger for sidebar */}
            <button
              type="button"
              aria-label="Open chapter list"
              onClick={() => onToggleChapters?.()}
              className="px-3 py-1 rounded border text-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 flex items-center"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Prev / Next chevrons on mobile */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous chapter"
                onClick={() => hasPrev && onPrevChapter?.()}
                disabled={!hasPrev}
                className={navBtnClass(hasPrev)}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                aria-label="Next chapter"
                onClick={() => hasNext && onNextChapter?.()}
                disabled={!hasNext}
                className={navBtnClass(hasNext)}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
