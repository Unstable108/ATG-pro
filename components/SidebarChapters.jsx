// components/SidebarChapters.jsx
import Link from "next/link";

export default function SidebarChapters({
  chapters,
  open,
  onClose,
  currentSlug,
}) {
  // desktop sidebar + mobile drawer
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-slate-200 dark:border-slate-700 pr-2">
          <h2 className="px-3 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Chapters
          </h2>
          <ul className="space-y-1 pb-4">
            {chapters.map((ch) => {
              const isActive = currentSlug === ch.slug;
              return (
                <li key={ch.slug}>
                  <Link
                    href={`/chapters/${ch.slug}`}
                    className={
                      "block px-3 py-2 rounded text-sm transition-colors " +
                      (isActive
                        ? "bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800")
                    }
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Chapter {ch.chapterNumber}
                    </div>
                    <div>
                      {ch.title || `Chapter ${ch.chapterNumber}`}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80%] bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold">Chapters</h2>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ul className="space-y-1 p-2">
                {chapters.map((ch) => {
                  const isActive = currentSlug === ch.slug;
                  return (
                    <li key={ch.slug}>
                      <Link
                        href={`/chapters/${ch.slug}`}
                        onClick={onClose}
                        className={
                          "block px-3 py-2 rounded text-sm transition-colors " +
                          (isActive
                            ? "bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800")
                        }
                      >
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Chapter {ch.chapterNumber}
                        </div>
                        <div>
                          {ch.title || `Chapter ${ch.chapterNumber}`}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
