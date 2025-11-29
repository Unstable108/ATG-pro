// components/TopBar.jsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
export default function TopBar({
  onSearch,
  initialSearch = '',
  isHidden = false,
  onMenuToggle,  // Callback for parent to know menu state
}) {
  const [q, setQ] = useState(initialSearch)
  const [siteTheme, setSiteTheme] = useState('light')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = router.pathname

  // Exact-match only: No highlight on /chapters/[slug] (reading) or other subpaths
  let currentView = null
  if (pathname === '/') currentView = 'home'
  else if (pathname === '/chapters') currentView = 'library'  // Assuming /chapters is your list page
  else if (pathname === '/feedback') currentView = 'feedback'

  useEffect(() => {
    try {
      const saved = localStorage.getItem('siteTheme')
      if (saved === 'dark') {
        document.documentElement.classList.add('dark')
        setSiteTheme('dark')
      } else {
        document.documentElement.classList.remove('dark')
        setSiteTheme('light')
      }
    } catch (e) {}
  }, [])

  const toggleSiteTheme = () => {
    const next = siteTheme === 'dark' ? 'light' : 'dark'
    setSiteTheme(next)
    try {
      if (next === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('siteTheme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('siteTheme', 'light')
      }
    } catch (e) {}
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    if (onSearch) {
      onSearch(query)
    } else {
      router.push(`/chapters?q=${encodeURIComponent(query)}`)
    }
    if (window.innerWidth < 768) setIsMenuOpen(false)  // Close mobile menu after submit
  }

  const getLinkClass = (view) => {
    if (!currentView) return 'px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'  // Inactive if no match
    const base = 'px-3 py-2 rounded-md text-sm font-medium transition-colors'
    return currentView === view
      ? `${base} text-blue-700 bg-blue-50 dark:text-white dark:bg-blue-900/50 border border-blue-200 dark:border-blue-500/30`
      : `${base} text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800`
  }

  // Wrapped toggle
  const toggleMenu = () => {
    const willOpen = !isMenuOpen;
    setIsMenuOpen(willOpen);
    if (!willOpen) setQ('')  // Clear search on menu close (optional, for fresh state)
    onMenuToggle?.(willOpen);  // Notify parent
  };

  // Logo click handler: Always go home + close menu
  const handleLogoClick = (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    onMenuToggle?.(false);
    router.push('/');
  };

  return (
    <nav className={`sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 transition-all duration-300 ${isHidden ? '-translate-y-full pointer-events-none' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Desktop Nav */}
          <div className="flex items-center">
            <Link href="/" onClick={handleLogoClick} className="flex-shrink-0 cursor-pointer">  {/* UPDATED: Add onClick for force close */}
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Celestial<span className="text-gray-900 dark:text-white">Novels</span>
              </span>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link href="/" className={getLinkClass('home')}>Home</Link>
                <Link href="/chapters" className={getLinkClass('library')}>Library</Link>
                <Link href="/feedback" className={getLinkClass('feedback')}>Feedback</Link>
              </div>
            </div>
          </div>
          {/* Search Bar - Desktop only */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 sm:mx-8">  {/* Hidden on mobile */}
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Chapter..."
                className="w-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-200 rounded-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
          </div>
          {/* Right Side: Theme + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleSiteTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {siteTheme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200"  // Minor hover transition
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6 transition-transform duration-200 rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">  {/* Animate icon swap */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Dropdown Menu - Animated */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-lg transition-all duration-300 ease-in-out z-40 ${
        isMenuOpen 
          ? 'translate-y-0 opacity-100 visible' 
          : '-translate-y-full opacity-0 invisible pointer-events-none'
      }`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {/* Mobile Search Form - Always visible in menu, no toggle */}
          {/* <div className="border-b border-gray-200 dark:border-slate-700 px-2 py-3">   */}
            {/* <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Chapter..."
                className="w-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-900 dark:text-gray-200 rounded-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form> */}
          {/* </div> */}

          {/* Nav Items */}
          <Link href="/" onClick={() => { setIsMenuOpen(false); onMenuToggle?.(false); }} className={`${getLinkClass('home')} block w-full text-left py-2`}>
            Home
          </Link>
          <Link href="/chapters" onClick={() => { setIsMenuOpen(false); onMenuToggle?.(false); }} className={`${getLinkClass('library')} block w-full text-left py-2`}>
            Library
          </Link>
          <Link href="/feedback" onClick={() => { setIsMenuOpen(false); onMenuToggle?.(false); }} className={`${getLinkClass('feedback')} block w-full text-left py-2`}>
            Feedback
          </Link>
        </div>
      </div>
    </nav>
  )
}