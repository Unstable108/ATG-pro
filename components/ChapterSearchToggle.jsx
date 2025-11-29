// components/ChapterSearchToggle.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Small search icon + expandable search box.
 *
 * Props:
 * - initialValue: string -> prefill when opening (e.g., from router.query.q)
 * - onSubmit: (term: string) => void -> called when user presses Enter
 * - placeholder: string
 */
export default function ChapterSearchToggle({
  initialValue = "",
  onSubmit,
  placeholder = "Search by number or title...",
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  // keep local state in sync if initialValue changes (e.g. URL query)
  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  // focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleIconClick = () => {
    setOpen((prev) => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const term = value.trim();
      if (onSubmit) onSubmit(term);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search icon button */}
      <button
        type="button"
        onClick={handleIconClick}
        className="inline-flex items-center justify-center rounded-full border border-gray-300 px-3 py-2 text-sm shadow-sm hover:bg-gray-100 dark:border-slate-600 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle chapter search"
      >
        {/* simple magnifying glass icon (no external deps) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      </button>

      {/* Expanding search input */}
      {open && (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-48 md:w-64 rounded-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900"
        />
      )}
    </div>
  );
}
