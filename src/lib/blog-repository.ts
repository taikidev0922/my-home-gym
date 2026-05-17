import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogArticle, BlogArticleBlock } from "@/lib/types";

type BlogArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  keyword: string;
  category: string;
  tags?: string[] | null;
  image_url: string | null;
  reading_minutes: number | null;
  published_at: string;
  updated_at: string | null;
  article_source: string | null;
  keyword_source: string | null;
  blocks: unknown;
  metadata: Record<string, unknown> | null;
};

type BlogSitemapArticleRow = {
  slug: string;
  published_at: string;
  updated_at: string | null;
};

export type BlogArticleQuery = {
  category?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
};

const categoryTagById: Record<string, string> = {
  guide: "作り方",
  rack: "パワーラック",
  dumbbell: "可変式ダンベル",
  bench: "ベンチ",
  floor: "床材・防音",
  compact: "省スペース",
};

const fallbackArticles: BlogArticle[] = [
  {
    id: "fallback-home-gym-start",
    slug: "home-gym-start-budget-space",
    title: "ホームジム作りは広さと予算から決めると失敗しにくい",
    excerpt: "本格ラックから省スペース宅トレまで、最初に決めたい広さ、予算、器具の優先順位を整理します。",
    keyword: "ホームジム 予算 広さ",
    category: "guide",
    tags: ["ホームジム", "作り方", "予算", "広さ"],
    imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1400&auto=format&fit=crop",
    readingMinutes: 5,
    publishedAt: new Date("2026-05-05T07:00:00+09:00").toISOString(),
    updatedAt: new Date("2026-05-05T07:00:00+09:00").toISOString(),
    articleSource: "fallback",
    keywordSource: "seed",
    metadata: {},
    blocks: [
      {
        heading: "最初に決めるのは器具ではなく置ける広さ",
        paragraphs: [
          "ホームジムは欲しい器具から考えると、部屋の動線や騒音で困りがちです。まずは使える畳数、天井高、床の強さ、家族の生活動線を確認します。",
          "1畳から2畳ならマット、チューブ、可変式ダンベルが中心です。3畳以上あればベンチやラックも候補に入ります。",
        ],
      },
      {
        heading: "予算は本体価格だけで見ない",
        paragraphs: [
          "ラックやベンチを買う場合、床材、バーベル、プレート、送料、追加パーツまで含めて考えると現実的です。",
          "最初は最低限の種目を決め、あとから増やせる構成にしておくと失敗しにくくなります。",
        ],
      },
    ],
  },
];
export async function getBlogArticles(): Promise<BlogArticle[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) return fallbackArticles;

  const { data, error } = await supabase
    .from("blog_articles")
    .select("*")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to load blog articles", error);
    return fallbackArticles;
  }

  if (data.length === 0) return fallbackArticles;

  return data.map((row) => mapArticleRow(row as BlogArticleRow));
}

export async function getBlogArticlesPage(query: BlogArticleQuery = {}) {
  const supabase = await createSupabaseServerClient();
  const pageSize = Math.max(1, Math.min(query.pageSize ?? 9, 24));
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!supabase) {
    const filtered = filterArticles(fallbackArticles, query);
    return createPageResult(filtered.slice(from, to + 1), filtered.length, page, pageSize);
  }

  let request = supabase
    .from("blog_articles")
    .select("*", { count: "exact" })
    .lte("published_at", new Date().toISOString());

  if (query.category) request = request.eq("category", query.category);
  if (query.tag) request = request.contains("tags", [query.tag]);

  const { data, error, count } = await request.order("published_at", { ascending: false }).range(from, to);

  if (error || !data) {
    console.error("Failed to load blog articles", error);
    const filtered = filterArticles(fallbackArticles, query);
    return createPageResult(filtered.slice(from, to + 1), filtered.length, page, pageSize);
  }

  return createPageResult(
    data.map((row) => mapArticleRow(row as BlogArticleRow)),
    count ?? data.length,
    page,
    pageSize,
  );
}

export async function getBlogSitemapArticles(limit = 50000) {
  const supabase = await createSupabaseServerClient();
  const pageSize = Math.max(1, Math.min(limit, 50000));

  if (!supabase) {
    return fallbackArticles.slice(0, pageSize).map((article) => ({
      slug: article.slug,
      updatedAt: article.updatedAt,
    }));
  }

  const { data, error } = await supabase
    .from("blog_articles")
    .select("slug,published_at,updated_at")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(pageSize);

  if (error || !data) {
    console.error("Failed to load blog sitemap articles", error);
    return fallbackArticles.slice(0, pageSize).map((article) => ({
      slug: article.slug,
      updatedAt: article.updatedAt,
    }));
  }

  return data.map((row) => {
    const article = row as BlogSitemapArticleRow;
    return {
      slug: article.slug,
      updatedAt: article.updated_at ?? article.published_at,
    };
  });
}

export async function getBlogKeywordHistory(limit = 5000) {
  const supabase = await createSupabaseServerClient();
  const pageSize = Math.max(1, Math.min(limit, 5000));

  if (!supabase) {
    return fallbackArticles.slice(0, pageSize).map((article) => ({ keyword: article.keyword }));
  }

  const { data, error } = await supabase
    .from("blog_articles")
    .select("keyword")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(pageSize);

  if (error || !data) {
    console.error("Failed to load blog keyword history", error);
    return fallbackArticles.slice(0, pageSize).map((article) => ({ keyword: article.keyword }));
  }

  return data
    .map((row) => ({ keyword: typeof row.keyword === "string" ? row.keyword : "" }))
    .filter((row) => row.keyword.length > 0);
}

export async function getBlogArticleFacets() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) return createFacets(fallbackArticles);

  const { data, error } = await supabase
    .from("blog_articles")
    .select("category,tags")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to load blog facets", error);
    return createFacets(fallbackArticles);
  }

  return createFacets(
    data.map((row) => ({
      category: typeof row.category === "string" ? row.category : "guide",
      tags: normalizeTags(row.tags, "", typeof row.category === "string" ? row.category : "guide"),
    })),
  );
}

export const getBlogArticleBySlug = cache(async function getBlogArticleBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return fallbackArticles.find((article) => article.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("slug", slug)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Failed to load blog article by slug", error);
    return null;
  }

  return data ? mapArticleRow(data as BlogArticleRow) : null;
});

export async function appendBlogArticle(article: Omit<BlogArticle, "id">) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    const error = new Error("SUPABASE_SERVICE_ROLE_KEY is required to publish generated blog articles.");
    error.name = "BlogStorageConfigError";
    throw error;
  }

  const { data: existing } = await supabase
    .from("blog_articles")
    .select("id")
    .eq("slug", article.slug)
    .maybeSingle();

  if (existing?.id) {
    return { skipped: true, slug: article.slug };
  }

  const { error } = await supabase.from("blog_articles").insert({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    keyword: article.keyword,
    category: article.category,
    tags: article.tags,
    image_url: article.imageUrl,
    reading_minutes: article.readingMinutes,
    published_at: article.publishedAt,
    updated_at: article.updatedAt,
    article_source: article.articleSource,
    keyword_source: article.keywordSource,
    blocks: article.blocks,
    metadata: article.metadata,
  });

  if (error) throw error;

  return { skipped: false, slug: article.slug };
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

function mapArticleRow(row: BlogArticleRow): BlogArticle {
  const blocks = normalizeBlocks(row.blocks);
  const firstInlineImageUrl = blocks.find((block) => block.visual?.imageUrl)?.visual?.imageUrl;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    keyword: row.keyword,
    category: row.category,
    tags: normalizeTags(row.tags, row.keyword, row.category),
    imageUrl:
      firstInlineImageUrl ??
      row.image_url ??
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1400&auto=format&fit=crop",
    readingMinutes: row.reading_minutes ?? 5,
    publishedAt: row.published_at,
    updatedAt: row.updated_at ?? row.published_at,
    articleSource: row.article_source ?? "unknown",
    keywordSource: row.keyword_source ?? "unknown",
    blocks,
    metadata: row.metadata ?? {},
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

function normalizeBlocks(value: unknown): BlogArticleBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((block): BlogArticleBlock | null => {
      if (!block || typeof block !== "object") return null;
      const candidate = block as { heading?: unknown; paragraphs?: unknown; visual?: unknown };
      if (typeof candidate.heading !== "string" || !Array.isArray(candidate.paragraphs)) return null;

      return {
        heading: candidate.heading,
        paragraphs: candidate.paragraphs.filter((paragraph): paragraph is string => typeof paragraph === "string"),
        visual: normalizeVisual(candidate.visual),
      };
    })
    .filter((block): block is BlogArticleBlock => Boolean(block));
}

function normalizeVisual(value: unknown): BlogArticleBlock["visual"] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as {
    title?: unknown;
    kind?: unknown;
    brief?: unknown;
    imageUrl?: unknown;
    alt?: unknown;
    caption?: unknown;
  };
  const title = typeof candidate.title === "string" ? candidate.title : "";
  const brief = typeof candidate.brief === "string" ? candidate.brief : "";
  const kind = typeof candidate.kind === "string" ? candidate.kind : "";

  if (!title || !brief) return undefined;

  return {
    title,
    kind: ["diagram", "table", "checklist", "comparison"].includes(kind)
      ? (kind as NonNullable<BlogArticleBlock["visual"]>["kind"])
      : "diagram",
    brief,
    imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : undefined,
    alt: typeof candidate.alt === "string" ? candidate.alt : undefined,
    caption: typeof candidate.caption === "string" ? candidate.caption : undefined,
  };
}

function normalizeTags(value: unknown, keyword: string, category: string) {
  const tags = Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).map((tag) => tag.trim())
    : [];

  if (tags.length > 0) return Array.from(new Set(tags));

  return Array.from(new Set([keyword, categoryTagById[category]].filter(Boolean)));
}
