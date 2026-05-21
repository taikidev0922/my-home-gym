import type { MetadataRoute } from "next";
import { getBlogSitemapArticles } from "@/lib/blog-repository";
import { getPublishedPostSitemapEntries } from "@/lib/gym-repository";
import { getRankingCategories } from "@/lib/product-rankings";
import { absoluteUrl } from "@/lib/seo";

const blogCategories = ["guide", "rack", "dumbbell", "bench", "floor", "compact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, articles] = await Promise.all([getPublishedPostSitemapEntries(), getBlogSitemapArticles()]);
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/rankings"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...getRankingCategories().map((category) => ({
      url: absoluteUrl(`/rankings?category=${category}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    {
      url: absoluteUrl("/blog"),
      lastModified: articles[0]?.updatedAt ? new Date(articles[0].updatedAt) : now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/feed.xml"),
      lastModified: articles[0]?.updatedAt ? new Date(articles[0].updatedAt) : now,
      changeFrequency: "daily",
      priority: 0.4,
    },
    ...blogCategories.map((category) => ({
      url: absoluteUrl(`/blog?category=${category}`),
      lastModified: articles[0]?.updatedAt ? new Date(articles[0].updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: new Date(post.lastModified),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
