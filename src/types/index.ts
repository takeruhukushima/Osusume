export type MediaType = 'book' | 'movie' | 'drama' | 'manga' | 'anime' | 'music' | 'zeitgeist';

export interface ContentMetadata {
  title: string;
  creator: string;
  year: string;
  importance: number;
  imageUrl: string;
  tags?: string[];
  relatedContent?: string[];
}

export interface Content {
  slug: string;
  type: MediaType;
  metadata: ContentMetadata;
  content: string;
}