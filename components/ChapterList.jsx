import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ChapterSearchToggle from './ChapterSearchToggle';

export default function ChapterList({ chapters, sortAsc, basePath, onSortToggle }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(''); // Temp input for typing
  const itemsPerPage = 20;

  // Sort chapters based on prop (asc/desc by chapterNumber) - FIXED: Corrected inversion
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = Number(a.chapterNumber) || 0;
    const bNum = Number(b.chapterNumber) || 0;
    return sortAsc ?   bNum - aNum : aNum - bNum;
  });

  const totalChapters = sortedChapters.length;
  const totalPages = Math.ceil(totalChapters / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentChapters = sortedChapters.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    setPageInput(''); // Clear input after jump
    // Smooth scroll to top of list
    const element = document.getElementById('all-chapters');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setPageInput(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      setCurrentPage(num); // Auto-update if valid
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = Number(pageInput);
      if (!isNaN(num)) {
        handlePageChange(num);
      }
    }
  };

  const handleInputBlur = () => {
    const num = Number(pageInput);
    if (!isNaN(num)) {
      handlePageChange(num);
    }
  };

  const handleChapterClick = (slug) => {
    router.push(`${basePath}/chapters/${slug}`);
  };

  // called when user presses Enter in home-page search box
  const handleHomeSearchSubmit = (term) => {
    if (!term) {
      router.push(`${basePath}/chapters`);
    } else {
      router.push({
        pathname: `${basePath}/chapters`,
        query: { q: term },
      });
    }
  };

  if (totalChapters === 0) {
    return <p className="text-center py-8 text-gray-500 dark:text-slate-400">No chapters available yet.</p>;
  }

  return (
    <div id="all-chapters" className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
      {/* Header - Includes your sort button here for context */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center">
          <button
        type="button"
        onClick={onSortToggle} // Attaching the click handler here
        className="mr-2 p-1 rounded-md transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" // Button styling for hover/focus feedback
        aria-label={ sortAsc ? "Sorted ascending – click to sort descending" : "Sorted descending – click to sort ascending" }
      >
        <svg
          className="w-5 h-5 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {/* Keeping the original SVG path */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      </button>
          Latest Chapters
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <ChapterSearchToggle
              onSubmit={handleHomeSearchSubmit}
              placeholder="Jump by number or title..."
            />
          </div>
          <span className="text-sm text-gray-500 dark:text-slate-400">Total: {totalChapters}</span>
          {/* <button
            type="button"
            onClick={onSortToggle}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-slate-700 transition-all duration-200"
            aria-label={
              sortAsc
                ? "Sorted ascending – click to sort descending"
                : "Sorted descending – click to sort ascending"
            }
          >
            Sort {sortAsc ? '↑' : '↓'}
          </button> */}
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-gray-100 dark:bg-slate-700">
        {currentChapters.map((ch) => (
          <div
            key={ch.slug}
            onClick={() => handleChapterClick(ch.slug)}
            className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 p-4 flex items-center justify-between group cursor-pointer transition-colors border-b dark:border-slate-600 last:border-b-0"
          >
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Chapter {ch.chapterNumber} {ch.title ? `- ${ch.title}` : ''}
              </span>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                {(ch.excerpt || '').slice(0, 140)}
                {(ch.excerpt || '').length > 140 ? '...' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <Link
                href={`${basePath}/chapters/${ch.slug}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
              >
                Read →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls - With Input Box & Larger Buttons */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-slate-600 flex justify-center items-center gap-4 bg-gray-50 dark:bg-slate-900">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm" // Larger: px-4 py-2
          >
            Prev
          </button>

          <span className="text-sm text-gray-600 dark:text-slate-400">
            Page
          </span>

          <input
            type="number"
            value={pageInput || currentPage}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            min={1}
            max={totalPages}
            className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 text-center text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={currentPage.toString()}
          />

          <span className="text-sm text-gray-600 dark:text-slate-400">
            of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm" // Larger: px-4 py-2
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}