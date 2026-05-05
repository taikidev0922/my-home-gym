import type { MetadataRoute } from "next";
import { getBlogArticles } from "@/lib/blog-repository";
import { getPublishedPosts } from "@/lib/gym-repository";
import { getRankingCategories } from "@/lib/product-rankings";
import { absoluteUrl } from "@/lib/seo";

const postPageSize = 48;
const maxPostPages = 20;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, articles] = await Promise.all([getAllPublishedPosts(), getBlogArticles()]);
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
      priority: 0.8,
    },
    ...articles.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/posts/${post.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

async function getAllPublishedPosts() {
  const posts = [];

  for (let page = 1; page <= maxPostPages; page += 1) {
    const result = await getPublishedPosts({ page, perPage: postPageSize });
    posts.push(...result.posts);

    if (posts.length >= result.total || result.posts.length === 0) {
      break;
    }
  }

  return posts;
}
