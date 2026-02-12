import type { CollectionEntry } from 'astro:content';

export function sortPosts(posts: CollectionEntry<'blog'>[]) {
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getAllTags(posts: CollectionEntry<'blog'>[]): Map<string, number> {
  const tags = new Map<string, number>();
  posts.forEach((post) => {
    post.data.tags.forEach((tag) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });
  return tags;
}

export function getArchivesByYear(posts: CollectionEntry<'blog'>[]): Map<number, CollectionEntry<'blog'>[]> {
  const sorted = sortPosts(posts);
  const archives = new Map<number, CollectionEntry<'blog'>[]>();
  sorted.forEach((post) => {
    const year = post.data.date.getFullYear();
    if (!archives.has(year)) archives.set(year, []);
    archives.get(year)!.push(post);
  });
  return archives;
}

export function slugify(str: string): string {
  return str.replace(/[^0-9A-Za-z\u4e00-\u9fa5]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}
