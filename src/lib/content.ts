import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { MediaType } from '@/types';

export async function getContentList(type: MediaType) {
  const contentDir = join(process.cwd(), 'contents', type);
  // TODO: Implement directory reading
  return [];
}

export async function getContent(type: MediaType, slug: string) {
  const contentPath = join(process.cwd(), 'contents', type, `${slug}.md`);
  const fileContents = await readFile(contentPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  return {
    metadata: data,
    content,
  };
}