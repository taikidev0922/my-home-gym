import { absoluteUrl, siteAuthorName, siteName } from "@/lib/seo";
import type { BlogArticle } from "@/lib/types";

export function createBlogBreadcrumbJsonLd(article?: Pick<BlogArticle, "slug" | "title">) {
  const items = [
    { name: "ホーム", item: absoluteUrl("/") },
    { name: "ブログ", item: absoluteUrl("/blog") },
    ...(article ? [{ name: article.title, item: absoluteUrl(`/blog/${article.slug}`) }] : []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export function createBlogArticleJsonLd(article: BlogArticle) {
  const articleUrl = absoluteUrl(`/blog/${article.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: article.title,
    description: article.excerpt,
    url: articleUrl,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: article.imageUrl ? [absoluteUrl(article.imageUrl)] : undefined,
    keywords: [article.keyword, ...article.tags].filter(Boolean).join(", "),
    articleSection: article.category,
    wordCount: estimateArticleWordCount(article),
    inLanguage: "ja-JP",
    author: {
      "@type": "Organization",
      name: siteAuthorName,
      url: absoluteUrl("/blog"),
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/favicon-512.webp"),
      },
    },
  };
}

export function createBlogCollectionJsonLd(articles: BlogArticle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteName} ブログ`,
    description: "ホームジム作りの広さ、予算、器具選び、床材、防音、畳数の考え方をまとめた記事一覧。",
    url: absoluteUrl("/blog"),
    inLanguage: "ja-JP",
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/favicon-512.webp"),
      },
    },
    blogPost: articles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      url: absoluteUrl(`/blog/${article.slug}`),
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      image: article.imageUrl ? absoluteUrl(article.imageUrl) : undefined,
    })),
  };
}

export function createBlogItemListJsonLd(articles: BlogArticle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/blog/${article.slug}`),
      name: article.title,
    })),
  };
}

function estimateArticleWordCount(article: BlogArticle) {
  const text = [article.title, article.excerpt, ...article.blocks.flatMap((block) => [block.heading, ...block.paragraphs])].join("");
  return text.length;
}
