# Celestial Novels (Next.js)

A multi-novel web reader built with Next.js and Tailwind CSS.

It serves chapter content from local Markdown files, pre-renders pages for speed, and includes reader personalization, chapter management, and feedback/admin utilities.

## Current Highlights

- Multi-novel library (`atg`, `lee-gwak`, `absolute-sword-sense`)
- Dynamic novel routes: `/<novelSlug>` and `/<novelSlug>/chapters/...`
- Backward-compatible ATG aliases:
  - `/` -> `/atg`
  - `/chapters` -> `/atg/chapters`
  - `/chapters/:chapter` -> `/atg/chapters/:chapter`
- Static generation (ISR) for novel pages and chapter pages
- Markdown chapters with frontmatter (`chapterNumber`, `title`, `publishedAt`)
- Reader UX features:
  - Previous/next chapter navigation
  - Keyboard navigation (`ArrowLeft/ArrowRight`, `J/K`)
  - Reading progress saved in `localStorage`
  - Continue-reading card
  - Bookmark toggle per novel/chapter
  - Reader controls and chapter sidebar
  - Light/dark site theme toggle
- Admin upload page (`/admin`) with token-protected API
- Feedback page (`/feedback`) posting to Telegram bot API
- Umami script integration in `_app.js`

## Tech Stack

- Next.js 13 (Pages Router)
- React 18
- Tailwind CSS
- Markdown parsing: `gray-matter`, `remark`, `remark-html`
- File upload parsing: `formidable`

## Project Structure

```text
.
|- components/
|  |- TopBar.jsx
|  |- SidebarChapters.jsx
|  |- ReaderControls.jsx
|  |- ChapterList.jsx
|  `- ...
|- content/
|  |- novels.json
|  `- novels/
|     |- atg/
|     |  |- novel.json
|     |  `- chapters/*.md
|     |- lee-gwak/
|     |  |- novel.json
|     |  `- chapters/*.md
|     `- absolute-sword-sense/
|        |- novel.json
|        `- chapters/*.md
|- lib/
|  |- novels.js
|  `- chapters.js
|- pages/
|  |- [novelSlug]/
|  |  |- index.js
|  |  `- chapters/
|  |     |- index.js
|  |     `- [chapter].js
|  |- api/
|  |  |- upload.js
|  |  |- feedback.js
|  |  |- track.js
|  |  `- sitemap.xml.js
|  |- library.js
|  |- admin.js
|  |- bookmarks.js
|  |- feedback.js
|  |- track.js
|  |- robots.txt.js
|  `- ...
|- styles/
`- next.config.js
```

## Local Development

1. Install dependencies

```bash
npm install
```

2. Start dev server

```bash
npm run dev
```

3. Open

- Main (ATG alias): `http://localhost:3000`
- Library: `http://localhost:3000/library`

## NPM Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linting

## Content Model

### `content/novels.json`
Defines all available novels and their slugs.

Example:

```json
{
  "novels": [
    { "slug": "atg", "title": "Against The Gods", "path": "/novels/atg" }
  ]
}
```

### `content/novels/<slug>/novel.json`
Stores per-novel metadata (title, subtitle, author, cover, description, etc.).

### Chapter Markdown Files
Path: `content/novels/<slug>/chapters/*.md`

Frontmatter shape:

```md
---
chapterNumber: 2047
title: "Chapter Title"
publishedAt: "2026-04-19"
---

Chapter body in markdown...
```

## Environment Variables

Create `.env.local` and set values as needed.

### Core

- `NEXT_PUBLIC_SITE_URL`
  - Used in SEO/canonical/meta generation and robots/sitemap references.

### Admin Upload API (`/api/upload`)

Required:
- `ADMIN_TOKEN`

Optional GitHub commit mode:
- `GITHUB_TOKEN`
- `REPO_OWNER`
- `REPO_NAME`
- `REPO_BRANCH` (optional, defaults to `main`)

Behavior:
- If GitHub vars are present, upload commits markdown directly to repo.
- Otherwise API returns generated `.md` content for manual download/save.

### Feedback API (`/api/feedback`)

- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT_ID`

Behavior:
- Sends submitted feedback messages to configured Telegram chat.

## Routing Overview

### Public Pages

- `/library` - Novel library list
- `/[novelSlug]` - Novel home page
- `/[novelSlug]/chapters` - Chapter listing + search/jump
- `/[novelSlug]/chapters/[chapter]` - Reader page
- `/bookmarks` - Local bookmark list
- `/feedback` - Feedback form

### Utility/Admin Pages

- `/admin` - Upload chapter UI
- `/track` - Analytics dashboard UI (tracking backend currently no-op)
- `/robots.txt` - Dynamic robots response

### API Routes

- `POST /api/upload` - Upload/create chapter markdown (token protected)
- `POST /api/feedback` - Submit feedback to Telegram
- `POST /api/track` - Event endpoint (currently returns success/no-op)
- `GET /api/sitemap.xml` - Sitemap endpoint

## Caching and ISR

- Novel and chapter pages use ISR (`revalidate` in page `getStaticProps`)
- `next.config.js` sets shared cache headers (`s-maxage=3600, stale-while-revalidate`)
- Static assets under `/_next/static/*` and `/images/*` get long-lived cache headers

## Notes

- This project currently uses the Next.js Pages Router.
- Bookmarks/progress/theme preferences are stored in browser `localStorage`.
- The README reflects the current codebase structure and behavior.
