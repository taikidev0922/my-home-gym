import { cache } from "react";
import { blogArticles } from "@/data/blog-articles";
import type { BlogArticle } from "@/lib/types";

export type BlogArticleQuery = {
  category?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
};

const articles = [...blogArticles].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

export async function getBlogArticles(): Promise<BlogArticle[]> {
  return getPublishedArticles();
}

export async function getBlogArticlesPage(query: BlogArticleQuery = {}) {
  const pageSize = Math.max(1, Math.min(query.pageSize ?? 9, 24));
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * pageSize;
  const filtered = filterArticles(getPublishedArticles(), query);

  return createPageResult(filtered.slice(from, from + pageSize), filtered.length, page, pageSize);
}

export async function getBlogSitemapArticles(limit = 50000) {
  return getPublishedArticles()
    .slice(0, Math.max(1, Math.min(limit, 50000)))
    .map((article) => ({
      slug: article.slug,
      updatedAt: article.updatedAt,
    }));
}

export async function getBlogKeywordHistory(limit = 5000) {
  return getPublishedArticles()
    .slice(0, Math.max(1, Math.min(limit, 5000)))
    .map((article) => ({ keyword: article.keyword }));
}

export async function getBlogArticleFacets() {
  return createFacets(getPublishedArticles());
}

export const getBlogArticleBySlug = cache(async function getBlogArticleBySlug(slug: string) {
  return getPublishedArticles().find((article) => article.slug === slug) ?? null;
});

export async function appendBlogArticle() {
  throw new Error("Blog articles are source-controlled. Use the source blog publishing script instead of DB writes.");
}

function getPublishedArticles() {
  const now = Date.now();
  return articles.filter((article) => Date.parse(article.publishedAt) <= now && isReadableJapaneseArticle(article));
}

function isReadableJapaneseArticle(article: BlogArticle) {
  const text = [article.title, article.excerpt, article.keyword, ...article.tags].join(" ");
  return !/[\u7e1d\u7e67\u7e3a\u8708\u8b41\u87b3\u83a0\u874e\u8b6b\u8b28\u9ae6\u9035]/.test(text);
}

function createPageResult(articles: BlogArticle[], total: number, page: number, pageSize: number) {
  return {
    articles,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function filterArticles(articles: BlogArticle[], query: BlogArticleQuery) {
  return articles.filter((article) => {
    if (query.category && article.category !== query.category) return false;
    if (query.tag && !article.tags.includes(query.tag)) return false;
    return true;
  });
}

function createFacets(articles: Array<{ category: string; tags: string[] }>) {
  const categoryCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();

  for (const article of articles) {
    categoryCounts.set(article.category, (categoryCounts.get(article.category) ?? 0) + 1);
    for (const tag of article.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  return {
    categories: Array.from(categoryCounts, ([id, count]) => ({ id, count })),
    tags: Array.from(tagCounts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}


