import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { KeywordCandidate } from "@/lib/blog-keywords";
import type { BlogArticle, BlogArticleBlock } from "@/lib/types";

type ClaudeArticlePayload = {
  title?: unknown;
  excerpt?: unknown;
  category?: unknown;
  readingMinutes?: unknown;
  blocks?: unknown;
};

const fallbackImages: Record<string, string> = {
  rack: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?q=80&w=1400&auto=format&fit=crop",
  dumbbell: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1400&auto=format&fit=crop",
  bench: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1400&auto=format&fit=crop",
  floor: "https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1400&auto=format&fit=crop",
  compact: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1400&auto=format&fit=crop",
  guide: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1400&auto=format&fit=crop",
};

export async function generateHomeGymArticle(keyword: KeywordCandidate): Promise<Omit<BlogArticle, "id">> {
  const article =
    process.env.CLAUDE_ARTICLE_LIVE === "true" && process.env.ANTHROPIC_API_KEY
      ? (await generateWithClaude(keyword)) ?? createFallbackArticle(keyword, "fallback-after-claude-error")
      : createFallbackArticle(keyword, "fallback");

  const imageUrl = await generateAndStoreBlogImage(article);

  return {
    ...article,
    imageUrl: imageUrl ?? article.imageUrl,
    metadata: {
      ...article.metadata,
      imageSource: imageUrl ? "gpt-image-1" : "fallback",
    },
  };
}

async function generateWithClaude(keyword: KeywordCandidate) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
        max_tokens: 2800,
        temperature: 0.65,
        messages: [
          {
            role: "user",
            content: buildArticlePrompt(keyword),
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const text = payload?.content?.find((part: { type?: string; text?: string }) => part.type === "text")?.text;
    if (typeof text !== "string") return null;

    const parsed = parseJson(text);
    if (!parsed) return null;

    return normalizeGeneratedArticle(keyword, parsed);
  } catch (error) {
    console.error("Failed to generate blog article with Claude", error);
    return null;
  }
}

async function generateAndStoreBlogImage(article: Omit<BlogArticle, "id">) {
  if (process.env.OPENAI_IMAGE_LIVE === "false") return null;
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt: buildImagePrompt(article),
        size: process.env.OPENAI_IMAGE_SIZE || "1536x1024",
        quality: process.env.OPENAI_IMAGE_QUALITY || "medium",
        n: 1,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      console.error("Failed to generate blog image", response.status, message.slice(0, 300));
      return null;
    }

    const payload = await response.json();
    const base64 = payload?.data?.[0]?.b64_json;
    if (typeof base64 !== "string") return null;

    return uploadBlogImage(article.slug, base64);
  } catch (error) {
    console.error("Failed to generate or store blog image", error);
    return null;
  }
}

async function uploadBlogImage(slug: string, base64: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const bytes = Buffer.from(base64, "base64");
  const path = `generated/${slug}.png`;

  const { error } = await supabase.storage.from("blog-images").upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });

  if (error) {
    console.error("Failed to upload generated blog image", error);
    return null;
  }

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}

function buildArticlePrompt(keyword: KeywordCandidate) {
  return `あなたは日本語のホームジム専門メディア「みんなのホームジム」の編集者です。

検索キーワード: ${keyword.keyword}
想定カテゴリ: ${keyword.category}

条件:
- これから自宅にトレーニングスペースを作る人向けに書く
- 広さ、予算、器具、床材、防音、安全性、購入前の確認ポイントを具体的に含める
- パワーラック、可変式ダンベル、ベンチ、マットなど必要に応じて触れる
- アフィリエイト商品比較に自然につながるが、露骨な販売文にしない
- 本文は日本語
- 誇張、医療効果、断定的な安全保証は避ける
- JSONだけを返す。Markdownや説明文は不要

JSON形式:
{
  "title": "32文字前後のタイトル",
  "excerpt": "80文字前後の概要",
  "category": "guide | rack | dumbbell | bench | floor | compact のどれか",
  "readingMinutes": 4,
  "blocks": [
    { "heading": "見出し", "paragraphs": ["本文段落", "本文段落"] }
  ]
}

blocksは4から6個、各paragraphsは1から2段落にしてください。`;
}

function buildImagePrompt(article: Omit<BlogArticle, "id">) {
  return `Photorealistic editorial hero image for a Japanese home gym blog.
Theme: ${article.keyword}
Article title: ${article.title}
Category: ${article.category}

Create a realistic, tidy home training space that fits the theme. Show practical details such as floor mats, compact storage, adjustable dumbbells, bench, rack, or resistance bands when relevant. Natural daylight, modern Japanese apartment or garage feeling, clean composition, no people, no logos, no readable text, no brand names, no watermarks. Wide horizontal composition for a blog hero image.`;
}

function parseJson(text: string): ClaudeArticlePayload | null {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonText) return null;

  try {
    return JSON.parse(jsonText) as ClaudeArticlePayload;
  } catch {
    return null;
  }
}

function normalizeGeneratedArticle(keyword: KeywordCandidate, payload: ClaudeArticlePayload): Omit<BlogArticle, "id"> | null {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const excerpt = typeof payload.excerpt === "string" ? payload.excerpt.trim() : "";
  const category = typeof payload.category === "string" ? normalizeCategory(payload.category.trim()) : normalizeCategory(keyword.category);
  const blocks = normalizeBlocks(payload.blocks);

  if (!title || !excerpt || blocks.length === 0) return null;

  const now = new Date().toISOString();

  return {
    slug: createSlug(keyword, title),
    title,
    excerpt,
    keyword: keyword.keyword,
    category,
    imageUrl: imageForCategory(category),
    readingMinutes: Number(payload.readingMinutes) || estimateReadingMinutes(blocks),
    publishedAt: now,
    updatedAt: now,
    articleSource: "claude",
    keywordSource: keyword.source,
    blocks,
    metadata: {
      keywordMetrics: keyword.metrics,
      generatedAt: now,
    },
  };
}

function createFallbackArticle(keyword: KeywordCandidate, source: string): Omit<BlogArticle, "id"> {
  const now = new Date().toISOString();
  const category = normalizeCategory(keyword.category);
  const title = `${keyword.keyword}で考えるホームジム作りの現実的な手順`;
  const blocks: BlogArticleBlock[] = [
    {
      heading: "まずは置ける面積を測る",
      paragraphs: [
        "ホームジム作りでは、器具より先に部屋の広さと動線を確認します。マットだけなら1畳前後でも始められますが、ベンチやラックを置くなら周囲に移動できる余白が必要です。",
        "パワーラックやハーフラックは高さも重要です。天井、照明、エアコン、扉の開閉位置まで確認してから候補を絞ると、購入後の失敗を減らせます。",
      ],
    },
    {
      heading: "予算は周辺アイテムまで含める",
      paragraphs: [
        "本体価格だけでなく、床材、防音マット、バーベル、プレート、送料、処分費も含めて見積もります。可変式ダンベル中心なら初期費用を抑えやすく、ラック構成なら後から拡張しやすいのが強みです。",
      ],
    },
    {
      heading: "最初の器具は種目から逆算する",
      paragraphs: [
        "ベンチプレス、スクワット、懸垂をやりたいならラック系が候補になります。ダンベルプレス、ローイング、ショルダープレスを中心にするなら可変式ダンベルとベンチでも十分に組めます。",
        "省スペース派はマット、チューブ、アブローラー、折りたたみベンチのように収納しやすいものから始めると続けやすくなります。",
      ],
    },
    {
      heading: "写真付き投稿で近い条件を比較する",
      paragraphs: [
        "同じ予算でも、賃貸、戸建て、ガレージ、ワンルームでは最適解が変わります。広さ、費用、器具構成が近い投稿を比較すると、自分の家で再現できるか判断しやすくなります。",
      ],
    },
  ];

  return {
    slug: createSlug(keyword, now),
    title,
    excerpt: `${keyword.keyword}をテーマに、広さ、予算、器具選び、床材までホームジム作りの判断ポイントを整理します。`,
    keyword: keyword.keyword,
    category,
    imageUrl: imageForCategory(category),
    readingMinutes: estimateReadingMinutes(blocks),
    publishedAt: now,
    updatedAt: now,
    articleSource: source,
    keywordSource: keyword.source,
    blocks,
    metadata: {
      keywordMetrics: keyword.metrics,
      generatedAt: now,
    },
  };
}

function normalizeBlocks(value: unknown): BlogArticleBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      if (!block || typeof block !== "object") return null;
      const candidate = block as { heading?: unknown; paragraphs?: unknown };
      if (typeof candidate.heading !== "string" || !Array.isArray(candidate.paragraphs)) return null;

      const paragraphs = candidate.paragraphs
        .filter((paragraph): paragraph is string => typeof paragraph === "string")
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      if (!candidate.heading.trim() || paragraphs.length === 0) return null;

      return {
        heading: candidate.heading.trim(),
        paragraphs,
      };
    })
    .filter((block): block is BlogArticleBlock => Boolean(block));
}

function createSlug(keyword: KeywordCandidate, value: string) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const category = normalizeCategory(keyword.category);
  const hash = createShortHash(`${keyword.keyword}:${value}:${Date.now()}`);
  return `home-gym-${category}-${date}-${hash}`;
}

function createShortHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
  }

  return Math.abs(hash).toString(36).slice(0, 6).padStart(6, "0");
}

function estimateReadingMinutes(blocks: BlogArticleBlock[]) {
  const chars = blocks.reduce(
    (total, block) => total + block.heading.length + block.paragraphs.join("").length,
    0,
  );
  return Math.max(3, Math.ceil(chars / 600));
}

function normalizeCategory(category: string) {
  return ["guide", "rack", "dumbbell", "bench", "floor", "compact"].includes(category) ? category : "guide";
}

function imageForCategory(category: string) {
  return fallbackImages[normalizeCategory(category)] ?? fallbackImages.guide;
}
