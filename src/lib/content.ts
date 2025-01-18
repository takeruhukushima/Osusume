import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { MediaType } from '@/types';

export async function getContentList(_type: MediaType) {
  // もし将来ディレクトリを読み込む場合、以下のように書けます:
  // const contentDir = join(process.cwd(), 'contents', type);
  // const files = await readdir(contentDir);
  // ...
  
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
