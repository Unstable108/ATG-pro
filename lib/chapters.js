import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const chaptersDirectory = path.join(process.cwd(), 'content', 'chapters')

export function getAllChapters() {
  const filenames = fs.readdirSync(chaptersDirectory)
  const chapters = filenames
    .filter(f => f.endsWith('.md'))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, '')
      const fullPath = path.join(chaptersDirectory, filename)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)
      return {
        slug,
        content,
        ...data,
      }
    })
  chapters.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
  return chapters
}

export function getChapterBySlug(slug) {
  const fullPath = path.join(chaptersDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  return {
    slug,
    content,
    ...data,
  }
}
