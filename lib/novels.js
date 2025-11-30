import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'content');

export async function getNovels() {
  const novelsData = JSON.parse(await fs.promises.readFile(path.join(contentDir, 'novels.json'), 'utf8'));
  return novelsData.novels;
}

export async function getNovel(slug) {
  const novels = await getNovels();
  const novel = novels.find(n => n.slug === slug);
  if (!novel) return null;

  const novelDataPath = path.join(contentDir, 'novels', slug, 'novel.json');
  const novelData = JSON.parse(await fs.promises.readFile(novelDataPath, 'utf8'));
  return { ...novel, ...novelData };
}