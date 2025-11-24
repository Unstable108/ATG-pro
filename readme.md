
# 📚 Against The Gods  — Lightning-Fast Web Novel Reader (Next.js)

ATG-Pro is a **high-performance, mobile-optimized web novel reader** built using **Next.js + GitHub-based chapter storage**. It delivers a smooth, app-like reading experience with chapter navigation, bookmarks, reader customization, and lightning-fast statically generated pages.

Live Website 👉 **https://atg-pro.vercel.app/**

---

## 🚀 Key Features

### ✅ Reading Experience
- Smooth & distraction-free chapter view
- **Open Sans** typography for book-like readability
- Adjustable **font size**
- Optional **sepia reading comfort mode**
- Auto-hide top UI while scrolling
- Reading progress saved per chapter
- Jump to previous/next chapter instantly

---

### ✅ Navigation & Discovery
- Full chapter index with search support
- Search by **chapter number**
- Smart fallback when chapter not found
- Mobile sidebar with scroll lock
- Active chapter highlighting

---

### ✅ Personalization
- Persistent bookmarks (stored locally)
- Remembers reading position
- Remembers reader settings
- Independent reading theme from system theme

---

### ✅ Performance & Architecture
- **Static chapter pre-rendering (SSG)**
- Markdown-based chapter content
- GitHub-powered content sourcing
- Fast mobile rendering
- Zero database requirement for reading

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js |
| Styling | TailwindCSS |
| Rendering | Static Generation (SSG) |
| Chapter Storage | GitHub repository markdown |
| Client Enhancements | React Hooks |
| Deployment | Vercel |

---

## 📦 Project Structure

```

/pages
├── index.js              # Landing page
├── chapters/[slug].js    # Individual chapter reader
└── bookmarks.js          # Saved chapters
/lib
└── chapters.js           # Reads chapter metadata + content
/components
├── TopBar.jsx
├── SidebarChapters.jsx
├── ReaderControls.jsx
└── ChapterList.jsx
/content/chapters
└── chapter-####.md       # Markdown chapters

````

---

## 🖥️ Running Locally

### 1. Clone Repository
```sh
git clone https://github.com/yourusername/atg-pro.git
cd atg-pro
````

### 2. Install Dependencies

```sh
npm install
```

### 3. Start Development Server

```sh
npm run dev
```

### 4. Visit App

```
http://localhost:3000
```

---

## 📱 Mobile-First Design Highlights

✅ full-width reading layout
✅ wider text column to reduce eye strain
✅ line-height tuned for readability
✅ bottom quick reader controls
✅ prevents page scrolling when chapter list is open

---

## 🔖 Bookmarks

Bookmarks are stored in browser local storage:

* works offline
* survives refresh and revisits
* does **not** require login

---

## 🔍 Search Behavior

| User Searches   | App Behavior                       |
| --------------- | ---------------------------------- |
| `2000`          | Navigates to chapter-2000          |
| `99999`         | Redirects to latest chapter        |
| non-number text | Lists title matches (if available) |

---

## 🌎 SEO & Social Preview

* Clean metadata per chapter
* Static pages crawlable by search engines
* Fast indexing due to SSG

---

## 🧪 Tested On

✅ Chrome
✅ Brave
✅ Firefox
✅ Safari iOS
✅ Android Chrome
✅ Desktop + Mobile

---

## 🏗️ Future Enhancements

* Chapter view analytics
* History reading timeline
* Faster chapter preload
* Offline reading mode
* Title full-text search

---

## 🐍 Optional — Download Chapters via Script

If you want to scrape or sync chapters locally, install:

```sh
pip install requests beautifulsoup4 lxml
```

---

## ⭐ Support & Contributions

If you like the project:

✅ Star the repository
✅ Share with others
✅ Suggest improvements

---

## 📄 License

MIT — free to modify and build upon.

---

