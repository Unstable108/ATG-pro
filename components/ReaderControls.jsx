// components/ReaderControls.jsx
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

const FONT_FAMILIES = [
  { id: "expo", label: "Expo", css: `"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` },
  { id: "sans", label: "Sans", css: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` },
  { id: "serif", label: "Serif", css: `Georgia, Cambria, "Times New Roman", Times, serif` },
];

export default function ReaderControls({
  showMobileControls = true,
  onToggleChapters, 
  onPrevChapter,
  onNextChapter,
  hasPrev = false,
  hasNext = false,
  novelTitle = "Novel Title",
  chapterTitle = "",
  currentSlug, // Needed to detect chapter change
}) {
  const router = useRouter();
  
  // -- State --
  const [fontSize, setFontSize] = useState(18); // Default to 16px to match CSS
  const [fontFamily, setFontFamily] = useState("expo"); // Default to expo
  const [lineHeight, setLineHeight] = useState(1.8); // Default line height
  const [isDark, setIsDark] = useState(false); // Track site dark mode
  const [isLoaded, setIsLoaded] = useState(false); // Flag to ensure apply after load
  const [mounted, setMounted] = useState(false); // For hydration/mounting
  
  // -- UI Visibility --
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const lastScrollY = useRef(0);
  const settingsRef = useRef(null);
  const settingsButtonRef = useRef(null);

  // NEW: control mobile bar visibility when sidebar opens/closes
  const [mobileBarVisible, setMobileBarVisible] = useState(true);

  // Mount for SSR hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. FIX: FORCE SCROLL TO TOP ON CHAPTER CHANGE
  useEffect(() => {
    // Immediate scroll to top
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    
    // Backup: Small timeout for cases where content loads slightly later
    const timer = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.scrollTo(0, 0);
        }
    }, 50);

    return () => clearTimeout(timer);
  }, [currentSlug]); // Trigger whenever currentSlug changes

  // Track site dark mode changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const updateDark = () => {
      setIsDark(root.classList.contains('dark'));
    };
    updateDark(); // initial
    const observer = new MutationObserver(updateDark);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // 2. Load Preferences
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" && window.localStorage.getItem("readerPrefs");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.fontSize) setFontSize(p.fontSize);
        if (p.fontFamily && FONT_FAMILIES.find(f => f.id === p.fontFamily)) setFontFamily(p.fontFamily);
        if (p.lineHeight) setLineHeight(p.lineHeight);
      }
    } catch (e) {
      console.error("Failed to load reader prefs:", e);
    } finally {
      setIsLoaded(true); // Ensure apply runs after potential load
    }
  }, []);

  // 3. Apply Styles (depend on isLoaded to ensure post-load apply)
  useEffect(() => {
    if (typeof document === "undefined" || !isLoaded) return;
    const root = document.documentElement;

    root.style.setProperty("--reader-font-size", `${fontSize}px`);
    const selectedFont = FONT_FAMILIES.find(f => f.id === fontFamily) || FONT_FAMILIES[0];
    root.style.setProperty("--reader-font-family", selectedFont.css);
    root.style.setProperty("--reader-line-height", lineHeight);
    
    // Save to localStorage
    localStorage.setItem("readerPrefs", JSON.stringify({ fontSize, fontFamily, lineHeight }));
  }, [fontSize, fontFamily, lineHeight, isLoaded]);

  // 4. Handle Scroll (Auto-hide UI)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 100) {
        setShowControls(true);
      } else {
        if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
          setShowControls(currentScrollY < lastScrollY.current);
        }
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 5. Close settings on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target) && 
          settingsButtonRef.current && !settingsButtonRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    if (showSettings && typeof document !== "undefined") {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [showSettings]);

  // NEW: Listen to sidebar open/close events to hide mobile bar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => setMobileBarVisible(false);
    const onClose = () => setMobileBarVisible(true);

    window.addEventListener('sidebar:open', onOpen);
    window.addEventListener('sidebar:close', onClose);

    return () => {
      window.removeEventListener('sidebar:open', onOpen);
      window.removeEventListener('sidebar:close', onClose);
    };
  }, []);

  // Reset to defaults
  const resetDefaults = () => {
    setFontSize(18);
    setFontFamily("expo");
    setLineHeight(1.8);
  };

  // -- Icons --
  const ChevronLeft = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
  const ChevronRight = ({ className = "h-5 w-5" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

  // -- Styles Helper --
  const getFloatingBarStyles = () => {
    return isDark ? 'bg-[#222]/95 border-[#333] text-gray-200 shadow-xl shadow-black/50' : 'bg-white/95 border-gray-200 text-gray-800 shadow-xl shadow-gray-200/50';
  };

  const getBarStyles = () => {
    return isDark ? 'bg-[#1e1e1e]/90 border-[#333] text-gray-200' : 'bg-white/90 border-gray-200 text-gray-900';
  };

  const getPopupStyles = () => {
    return isDark ? 'bg-[#222] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800';
  };

  const getArrowStyles = () => {
    return isDark ? 'bg-[#222] border-gray-700' : 'bg-white border-gray-200';
  };

  const dividerClass = () => isDark ? 'bg-white/10' : 'bg-gray-300';

  if (!mounted) return null; // Hide until mounted to prevent hydration mismatch

  return (
    <>
      {/* ───────────────────────────────────────
          DESKTOP UI (Laptop) - Only floating and top bar
      ─────────────────────────────────────── */}
      <div className="hidden md:block">
        {/* Top Bar (Auto-hides) */}
        <div className={`fixed top-0 left-0 right-0 z-40 px-4 py-3 flex justify-between items-center border-b shadow-sm transition-transform duration-300 backdrop-blur-md ${getBarStyles()} ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
            <button onClick={() => router.push('/')} className="flex items-center text-sm font-semibold hover:opacity-75 group">
              <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
            <div className="flex flex-col items-center flex-1 mx-4">
               <h1 className="text-sm font-bold truncate max-w-md text-center">{novelTitle}</h1>
               {chapterTitle && <span className="text-xs opacity-75">{chapterTitle}</span>}
            </div>
            <div className="w-16"></div> 
        </div>

        {/* Floating Sticky Bar (Bottom Center) */}
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-500 ease-out ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
          <div className={`flex items-center gap-1 p-1.5 rounded-full border backdrop-blur-md ${getFloatingBarStyles()}`}>
            {/* Previous Button */}
            <button onClick={() => hasPrev && onPrevChapter?.()} disabled={!hasPrev} className={`p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${!hasPrev && 'opacity-30'}`}>
                 <ChevronLeft className="w-5 h-5" />
            </button>
            <div className={`w-px h-6 mx-1 ${dividerClass()}`}></div>
            {/* TOC Button */}
            <button 
              onClick={onToggleChapters} 
              className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative group" 
              title="Chapters"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

              {/* Font Size Controls */}
              <button onClick={() => setFontSize(s => Math.max(12, s - 1))} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors w-10 text-center">
                 <span className="text-xs font-bold">A-</span>
              </button>
              <span className="px-2 py-1 text-xs font-medium min-w-[2rem] text-center">{fontSize}px</span>
              <button onClick={() => setFontSize(s => Math.min(32, s + 1))} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors w-10 text-center">
                 <span className="text-sm font-bold">A+</span>
              </button>

              <div className={`w-px h-6 mx-1 ${dividerClass()}`}></div>

              {/* Settings */}
              <button ref={settingsButtonRef} onClick={() => setShowSettings(!showSettings)} className={`p-3 rounded-full transition-colors relative ${showSettings ? 'bg-blue-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <div className={`w-px h-6 mx-1 ${dividerClass()}`}></div>

              {/* Next Button */}
              <button onClick={() => hasNext && onNextChapter?.()} disabled={!hasNext} className={`p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${!hasNext && 'opacity-30'}`}>
                 <ChevronRight className="w-5 h-5" />
              </button>
          </div>

          {/* Settings Popup */}
          {showSettings && (
            <div ref={settingsRef} className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-5 rounded-2xl shadow-2xl border w-80 animate-fadeIn origin-bottom ${getPopupStyles()}`}>
               <div className="space-y-5">
                   <div>
                       <label className="text-xs font-bold uppercase tracking-wide mb-3 block opacity-60">Font</label>
                       <div className="flex rounded-lg overflow-hidden border border-gray-500/30 p-1 gap-1">
                           <button onClick={() => setFontFamily('expo')} className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${fontFamily === 'expo' ? 'bg-blue-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Expo</button>
                           <button onClick={() => setFontFamily('sans')} className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${fontFamily === 'sans' ? 'bg-blue-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Sans</button>
                           <button onClick={() => setFontFamily('serif')} className={`flex-1 py-2 rounded text-serif font-medium transition-colors ${fontFamily === 'serif' ? 'bg-blue-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Serif</button>
                       </div>
                   </div>
                   {/* <div>
                       <label className="text-xs font-bold uppercase tracking-wide mb-3 block opacity-60">Theme</label>
                       <div className="flex rounded-lg overflow-hidden border border-gray-500/30 p-1 gap-1">
                           <button onClick={() => setFontFamily('expo')} className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${fontFamily === 'expo' ? 'bg-blue-600 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>Sepia</button>
                       </div>
                   </div> */}
                   <div>
                       <label className="text-xs font-bold uppercase tracking-wide mb-3 block opacity-60">Line Height</label>
                       <div className="flex items-center justify-center space-x-2">
                           <button onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))} className="px-2 py-1 rounded border text-xs font-medium hover:bg-gray-100 dark:hover:bg-slate-700">-</button>
                           <span className="text-sm font-medium min-w-[3rem] text-center">{lineHeight.toFixed(1)}x</span>
                           <button onClick={() => setLineHeight(Math.min(2.0, lineHeight + 0.1))} className="px-2 py-1 rounded border text-xs font-medium hover:bg-gray-100 dark:hover:bg-slate-700">+</button>
                       </div>
                   </div>
                   <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                       <button onClick={resetDefaults} className="w-full py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                           Reset to Defaults
                       </button>
                   </div>
               </div>
               <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-b border-r ${getArrowStyles()}`}></div>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────
          MOBILE UI (Exact old) - now hides when sidebar opens
      ─────────────────────────────────────── */}
      {showMobileControls && mobileBarVisible && (
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
              onClick={() => {
                // hide mobile bar immediately for snappy UX, final visibility will be managed by sidebar events
                setMobileBarVisible(false);
                onToggleChapters?.();
              }}
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
                className={`px-3 py-1 rounded border text-sm font-medium flex items-center justify-center ${
                  hasPrev
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800"
                    : "bg-transparent text-gray-400 border border-transparent cursor-not-allowed opacity-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next chapter"
                onClick={() => hasNext && onNextChapter?.()}
                disabled={!hasNext}
                className={`px-3 py-1 rounded border text-sm font-medium flex items-center justify-center ${
                  hasNext
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800"
                    : "bg-transparent text-gray-400 border border-transparent cursor-not-allowed opacity-50"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
