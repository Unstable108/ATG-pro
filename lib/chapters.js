import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function getAllChapters(slug = 'atg') {
  const chaptersDirectory = path.join(process.cwd(), 'content', 'novels', slug, 'chapters')
  if (!fs.existsSync(chaptersDirectory)) {
    console.warn(`Chapters directory not found: ${chaptersDirectory}`)
    return []
  }
  const filenames = await fs.promises.readdir(chaptersDirectory)
  const chapters = await Promise.all(
    filenames
      .filter(f => f.endsWith('.md'))
      .map(async (filename) => {
        const slug = filename.replace(/\.md$/, '')
        const fullPath = path.join(chaptersDirectory, filename)
        const fileContents = await fs.promises.readFile(fullPath, 'utf8')
        const { data, content } = matter(fileContents)
        return {
          slug,
          content,
          ...data,
        }
      })
  )
  chapters.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
  return chapters
}

export async function getChapterBySlug(slug, chapterSlug) {
  const fullPath = path.join(process.cwd(), 'content', 'novels', slug, 'chapters', `${chapterSlug}.md`)
  if (!fs.existsSync(fullPath)) {
    console.warn(`Chapter not found: ${fullPath}`)
    return null
  }
  const fileContents = await fs.promises.readFile(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  return {
    slug: chapterSlug,
    content,
    ...data,
  }
}