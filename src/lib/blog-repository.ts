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
  image_url: string | null;
  reading_minutes: number | null;
  published_at: string;
  updated_at: string | null;
  article_source: string | null;
  keyword_source: string | null;
  blocks: unknown;
  metadata: Record<string, unknown> | null;
};

const fallbackArticles: BlogArticle[] = [
  {
    id: "fallback-home-gym-start",
    slug: "home-gym-start-budget-space",
    title: "ホームジム作りは広さと予算から決めると失敗しにくい",
    excerpt:
      "パワーラックの本格派からヨガマット中心の省スペース派まで、最初に決めたい広さ、予算、器具の優先順位を整理します。",
    keyword: "ホームジム 予算 広さ",
    category: "guide",
    imageUrl:
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1400&auto=format&fit=crop",
    readingMinutes: 5,
    publishedAt: new Date("2026-05-05T07:00:00+09:00").toISOString(),
    updatedAt: new Date("2026-05-05T07:00:00+09:00").toISOString(),
    articleSource: "fallback",
    keywordSource: "seed",
    metadata: {},
    blocks: [
      {
        heading: "最初に決めるのは器具ではなく置ける面積",
        paragraphs: [
          "ホームジムは欲しい器具から考え始めると、部屋に置いたあとで動線や騒音に困りがちです。まずは使える床面積、天井高、床の強さ、家族の生活動線を確認します。",
          "1から2畳ならマット、チューブ、可変式ダンベルが中心。4畳以上あればベンチやラックも候補に入ります。",
        ],
      },
      {
        heading: "予算は本体価格だけで見ない",
        paragraphs: [
          "ラックやベンチを買う場合、床材、バーベル、プレート、配送費、処分費まで含めて考えると現実的です。",
          "まずは最低限の種目を決め、あとから増やせる構成にしておくと失敗しにくくなります。",
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

export async function getBlogArticleBySlug(slug: string) {
  const articles = await getBlogArticles();
  return articles.find((article) => article.slug === slug) ?? null;
}

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

function mapArticleRow(row: BlogArticleRow): BlogArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    keyword: row.keyword,
    category: row.category,
    imageUrl:
      row.image_url ??
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1400&auto=format&fit=crop",
    readingMinutes: row.reading_minutes ?? 5,
    publishedAt: row.published_at,
    updatedAt: row.updated_at ?? row.published_at,
    articleSource: row.article_source ?? "unknown",
    keywordSource: row.keyword_source ?? "unknown",
    blocks: normalizeBlocks(row.blocks),
    metadata: row.metadata ?? {},
  };
}

function normalizeBlocks(value: unknown): BlogArticleBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      if (!block || typeof block !== "object") return null;
      const candidate = block as { heading?: unknown; paragraphs?: unknown };
      if (typeof candidate.heading !== "string" || !Array.isArray(candidate.paragraphs)) return null;

      return {
        heading: candidate.heading,
        paragraphs: candidate.paragraphs.filter((paragraph): paragraph is string => typeof paragraph === "string"),
      };
    })
    .filter((block): block is BlogArticleBlock => Boolean(block));
}
