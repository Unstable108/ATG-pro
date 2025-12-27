// components/SidebarChapters.jsx
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function SidebarChapters({
  chapters,
  open,
  onClose,
  currentSlug,
  basePath = '', 
}) {
  const scrollRef = useRef(null);

  // 1. Lock Body Scroll when sidebar is OPEN (prevents dual scrolling)
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    if (open) {
      // Lock scroll
      document.body.style.overflow = "hidden";

      // Dispatch event so other components (ReaderControls) can react.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event('sidebar:open'));
      }
    } else {
      // Unlock scroll
      document.body.style.overflow = "";

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event('sidebar:close'));
      }
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = "";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event('sidebar:close'));
      }
    };
  }, [open]);

  // 2. Auto-scroll to active chapter inside the sidebar
  useEffect(() => {
    if (open && scrollRef.current) {
      const timer = setTimeout(() => {
        const activeEl = scrollRef.current.querySelector('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({ 
            behavior: 'auto', 
            block: 'center' 
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, currentSlug]); 

  const getChapterLink = (slug) => `${basePath}/chapters/${slug}`;

  // If not open, render nothing (Clean DOM)
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop - Clicks here close the sidebar */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding Drawer - Works for Desktop AND Mobile now */}
      <div className="relative w-80 max-w-[85%] bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col h-full border-r border-gray-200 dark:border-gray-800 animate-slideInLeft">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#222]">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Table of Contents</h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
            aria-label="Close chapter list"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-2">
          <ul className="space-y-1">
            {chapters.map((ch) => {
              const isActive = currentSlug === ch.slug;
              return (
                <li key={ch.slug} data-active={isActive ? 'true' : 'false'}>
                  <Link
                    href={getChapterLink(ch.slug)}
                    onClick={onClose} // Close sidebar when clicking a link
                    className={
                      "block px-4 py-3 rounded-lg text-sm transition-all " +
                      (isActive
                        ? "bg-blue-600 text-white font-semibold shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5")
                    }
                  >
                    <div className={`text-xs mb-0.5 ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-500'}`}>
                      Chapter {ch.chapterNumber}
                    </div>
                    <div className="truncate">
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
  );
}
