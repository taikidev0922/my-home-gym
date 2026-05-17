import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { KeywordCandidate } from "@/lib/blog-keywords";
import type { BlogArticle, BlogArticleBlock, ProductCategory } from "@/lib/types";
import { buildAffiliatePromptSection, type AffiliateProduct } from "@/lib/affiliate-products";
import { getAffiliateProductsForGeneration } from "@/lib/affiliate-products-server";

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

const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
const OPENAI_IMAGE_MODEL = "gpt-image-2";
const OPENAI_IMAGE_QUALITY = "high";
const CLAUDE_TIMEOUT_MS = 60_000;
const IMAGE_TIMEOUT_MS = 260_000;

export async function generateHomeGymArticle(keyword: KeywordCandidate): Promise<Omit<BlogArticle, "id">> {
  console.info("[blog-cron] start article generation", { keyword: keyword.keyword, category: keyword.category });
  const affiliateProducts = await getAffiliateProductsForGeneration();
  const generatedArticle =
    process.env.ANTHROPIC_API_KEY
      ? (await generateWithClaude(keyword, affiliateProducts)) ?? createFallbackArticle(keyword, "fallback-after-claude-error")
      : createFallbackArticle(keyword, "fallback");
  const article = ensureAffiliatePlacement(generatedArticle, affiliateProducts);

  console.info("[blog-cron] article text ready", {
    slug: article.slug,
    title: article.title,
    affiliateMarkers: collectAffiliateMarkers(article.blocks),
  });
  const blocks = await generateAndAttachInlineVisuals(article);
  const inlineVisualCount = blocks.filter((block) => block.visual?.imageUrl).length;
  const firstInlineImageUrl = blocks.find((block) => block.visual?.imageUrl)?.visual?.imageUrl;

  if (requiresGeneratedImages() && inlineVisualCount < 2) {
    throw new Error(
      "Generated blog images are required, but gpt-image generation did not produce two inline visual images.",
    );
  }

  console.info("[blog-cron] article generation complete", {
    slug: article.slug,
    inlineVisualCount,
    imageModel: imageModel(),
  });

  return {
    ...article,
    blocks,
    tags: article.tags.length ? article.tags : createArticleTags(keyword.keyword, article.category),
    imageUrl: firstInlineImageUrl ?? article.imageUrl,
    metadata: {
      ...article.metadata,
      imageModel: imageModel(),
      imageSource: firstInlineImageUrl ? `${imageModel()} inline visual` : "fallback",
      inlineVisualCount,
      affiliateLinks: collectAffiliateMarkers(blocks),
    },
  };
}

async function generateWithClaude(keyword: KeywordCandidate, affiliateProducts: AffiliateProduct[]) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 5000,
        temperature: 0.55,
        messages: [
          {
            role: "user",
            content: buildArticlePrompt(keyword, affiliateProducts),
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      console.error("Claude article request failed", response.status, message.slice(0, 300));
      return null;
    }

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

async function generateAndStoreBlogImage(
  article: Omit<BlogArticle, "id">,
  variant: "inline",
  visual?: NonNullable<BlogArticleBlock["visual"]>,
) {
  if (!openAiApiKey()) {
    console.error("OPENAI_API_KEY is required for blog image generation.");
    return null;
  }

  try {
    console.info("[blog-cron] start image generation", {
      slug: article.slug,
      visualTitle: visual?.title,
      model: imageModel(),
      quality: OPENAI_IMAGE_QUALITY,
    });

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey()}`,
      },
      body: JSON.stringify({
        model: imageModel(),
        prompt: buildInlineVisualPrompt(article, visual),
        quality: OPENAI_IMAGE_QUALITY,
        output_format: "webp",
        n: 1,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      console.error("Failed to generate blog image", response.status, message.slice(0, 300));
      return null;
    }

    const payload = await response.json();
    const base64 = payload?.data?.[0]?.b64_json;
    if (typeof base64 !== "string") return null;

    const publicUrl = await uploadBlogImage(
      `${article.slug}-${variant}${visual ? `-${createShortHash(visual.title)}` : ""}`,
      base64,
    );
    console.info("[blog-cron] image stored", { slug: article.slug, visualTitle: visual?.title, publicUrl });
    return publicUrl;
  } catch (error) {
    console.error("Failed to generate or store blog image", error);
    return null;
  }
}

async function generateAndAttachInlineVisuals(article: Omit<BlogArticle, "id">) {
  const candidates = article.blocks.filter((block) => block.visual).slice(0, 2);

  if (!candidates.length) {
    return article.blocks;
  }

  console.info("[blog-cron] inline visual candidates", { slug: article.slug, count: candidates.length });
  const generatedVisuals = await Promise.all(
    candidates.map(async (block) => {
      if (!block.visual) return null;
      const imageUrl = await generateAndStoreBlogImage(article, "inline", block.visual);
      return imageUrl ? { heading: block.heading, imageUrl } : null;
    }),
  );
  const visualUrlByHeading = new Map(
    generatedVisuals
      .filter((visual): visual is { heading: string; imageUrl: string } => Boolean(visual))
      .map((visual) => [visual.heading, visual.imageUrl] as const),
  );

  return article.blocks.map((block) => {
    const imageUrl = visualUrlByHeading.get(block.heading);
    if (!block.visual || !imageUrl) return block;

    return {
      ...block,
      visual: {
        ...block.visual,
        imageUrl,
        alt: block.visual.alt || `${article.title} - ${block.visual.title}`,
      },
    };
  });
}

async function uploadBlogImage(slug: string, base64: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const bytes = Buffer.from(base64, "base64");
  const path = `generated/${slug}.webp`;

  const { error } = await supabase.storage.from("blog-images").upload(path, bytes, {
    contentType: "image/webp",
    upsert: true,
  });

  if (error) {
    console.error("Failed to upload generated blog image", error);
    return null;
  }

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}

function buildArticlePrompt(keyword: KeywordCandidate, affiliateProducts: AffiliateProduct[]) {
  return `あなたは日本語のホームジム専門メディア「My Home Gym」の編集者です。
検索キーワード: ${keyword.keyword}
想定カテゴリ: ${keyword.category}
${buildAffiliatePromptSection(affiliateProducts)}

記事の狙い:
- これから自宅にトレーニング環境を作る人、または自宅用の筋トレ器具を選ぶ人に向けて書く。
- 「ホームジム」という言葉を無理にタイトルや本文へ入れなくてよい。検索キーワードの意図を主役にする。
- 可変式ダンベル、パワーラック、ハーフラック、ベンチ、床材、防音、懸垂マシン、ミラーなど器具寄りの検索意図なら、その器具の選び方・注意点・向いている人を深く書く。
- 広さ、予算、床材、防音、安全性は記事テーマに関係する場合だけ具体的に触れる。毎回すべてを入れない。
- 読者が購入前に判断できるように、サイズ、重量、設置条件、失敗しやすい点、代替案を実用的に整理する。
- アフィリエイト商品比較につながるが、過剰な販売文にしない。
- 本文は日本語。誇張、断定的な効果、確定的な安全保証は避ける。
- JSONだけを返す。Markdownや説明文は不要。

品質基準:
- ありきたりな一般論を避ける。
- 冒頭から結論を出す。
- 各ブロックの見出しは具体的にする。
- 本文には読者の判断軸、寸法や設置の見方、失敗回避の観点を入れる。
- 商品カードを入れる場合は、その直前の段落で商品カテゴリに触れてから {{affiliate:カテゴリ-順位}} を単独段落として入れる。
- 記事内容に自然に合う商品がある場合は、最低1つは商品カードを入れる。

JSON形式:
{
  "title": "32文字前後のタイトル",
  "excerpt": "80文字前後の概要",
  "category": "guide | rack | dumbbell | bench | floor | compact のどれか",
  "readingMinutes": 4,
  "blocks": [
    {
      "heading": "具体的な見出し",
      "paragraphs": ["本文段落", "{{affiliate:カテゴリ-順位}}", "本文段落"],
      "visual": {
        "title": "図表タイトル",
        "kind": "diagram | table | checklist | comparison",
        "brief": "この画像で説明する内容。数値、比較軸、チェック項目、配置を具体的に書く",
        "alt": "画像の代替テキスト",
        "caption": "画像下に表示する短い補足"
      }
    }
  ]
}

blocksは4から6個。各paragraphsは1から3段落。visualは本文理解に役立つ2ブロックだけに付けてください。
visual.briefは検索キーワードと本文内容に必ず対応させ、一般的な飾り画像ではなく、比較表、配置図、予算内訳、チェックリストなど実用的な図表にしてください。
スマホで一目で分かることを優先し、1枚の図表で扱う主題は1つ、主要情報は3点以内に絞ってください。`;
}

function buildInlineVisualPrompt(
  article: Omit<BlogArticle, "id">,
  visual?: NonNullable<BlogArticleBlock["visual"]>,
) {
  return `Create a high-quality editorial infographic image for a Japanese home gym article.
Article keyword: ${article.keyword}
Article title: ${article.title}
Visual title: ${visual?.title ?? article.title}
Visual kind: ${visual?.kind ?? "diagram"}
Required content:
${visual?.brief ?? article.excerpt}

Design requirements:
- The image must directly explain the required content above.
- Use a clean, bright editorial fitness style that fits a light home gym website.
- Prefer white or warm off-white backgrounds, high contrast dark text, and orange accents.
- Design mobile-first. It should be instantly understandable on a smartphone screen.
- Reduce information density. Use one clear message per image and at most three main sections, cards, steps, or comparison columns.
- Keep Japanese text very short: headline plus short labels only. Avoid paragraphs, dense tables, tiny annotations, footnotes, and long lists.
- Use large readable typography, generous spacing, and big simple icons or shapes.
- Prefer simple layouts: 3-step flow, 3-card comparison, one room layout diagram, or a short checklist with 3 items.
- No brand logos, no fictional prices presented as official product prices, no watermarks.
- 16:9 horizontal infographic, polished, practical, not decorative.`;
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
    tags: createArticleTags(keyword.keyword, category),
    imageUrl: imageForCategory(category),
    readingMinutes: Number(payload.readingMinutes) || estimateReadingMinutes(blocks),
    publishedAt: now,
    updatedAt: now,
    articleSource: "claude",
    keywordSource: keyword.source,
    blocks,
    metadata: {
      keywordMetrics: keyword.metrics,
      keywordScore: keyword.score,
      generatedAt: now,
    },
  };
}

function createFallbackArticle(keyword: KeywordCandidate, source: string): Omit<BlogArticle, "id"> {
  const now = new Date().toISOString();
  const category = normalizeCategory(keyword.category);
  const title = `${keyword.keyword}で失敗しない自宅トレ環境の作り方`;
  const blocks: BlogArticleBlock[] = [
    {
      heading: "最初に決めるのは器具ではなく使い方",
      paragraphs: [
        "自宅トレの環境づくりでは、最初に買う器具よりも「どの種目を週に何回やるか」を決める方が失敗しにくくなります。ベンチプレス、スクワット、ダンベル種目、懸垂のどれを中心にするかで、必要な広さも床対策も変わります。",
        "特にラックやベンチを置く場合は、本体サイズだけでなく、プレート交換、ダンベルを置く場所、身体を回り込ませる余白まで含めて考える必要があります。",
      ],
    },
    {
      heading: "予算は本体価格だけで見ない",
      paragraphs: [
        "器具本体が安く見えても、床材、防音マット、バーベル、プレート、工具、搬入時の送料まで含めると総額は変わります。可変式ダンベル中心なら初期費用を抑えやすく、ラック構成なら後から拡張しやすいのが強みです。",
      ],
      visual: {
        title: "初期費用の見落としポイント",
        kind: "comparison",
        brief:
          "自宅トレ環境の初期費用を、本体器具、床対策、周辺小物の3つに分けて比較する。各カードには予算の見落とし例を1つずつ入れる。",
        alt: "自宅トレ環境の初期費用を構成別に比較した表",
        caption: "本体価格だけでなく、床対策と周辺小物まで見ておくと予算感がつかみやすくなります。",
      },
    },
    {
      heading: "テーマに合う器具を一つずつ足す",
      paragraphs: [
        "省スペースで始めるなら可変式ダンベルとベンチ、本格的にBIG3を行うならラックと床補強が候補になります。いきなり全部を揃えるより、最初にやる種目を決めて不足する器具だけ足す方が、部屋も予算も圧迫しにくいです。",
      ],
      visual: {
        title: "目的別の器具選び",
        kind: "diagram",
        brief:
          "目的から必要器具へつなげる3分岐の図。省スペースは可変式ダンベル、胸肩トレはベンチ、本格BIG3はラックと床対策に分ける。",
        alt: "目的別に自宅トレ器具を選ぶフローチャート",
        caption: "先に種目を決めると、買うべき器具の優先順位が整理できます。",
      },
    },
    {
      heading: "購入前に寸法と動線を確認する",
      paragraphs: [
        "同じ予算でも、賃貸、持ち家、ガレージ、ワンルームでは最適解が変わります。幅、奥行き、高さ、可動域、収納場所をメジャーで確認し、写真付きの投稿やランキングを見比べると、自分の部屋で再現できるか判断しやすくなります。",
      ],
    },
  ];

  return {
    slug: createSlug(keyword, now),
    title,
    excerpt: `${keyword.keyword}をテーマに、広さ、予算、器具選び、床対策まで自宅トレ環境づくりの判断ポイントを整理します。`,
    keyword: keyword.keyword,
    category,
    tags: createArticleTags(keyword.keyword, category),
    imageUrl: imageForCategory(category),
    readingMinutes: estimateReadingMinutes(blocks),
    publishedAt: now,
    updatedAt: now,
    articleSource: source,
    keywordSource: keyword.source,
    blocks,
    metadata: {
      keywordMetrics: keyword.metrics,
      keywordScore: keyword.score,
      generatedAt: now,
    },
  };
}

function normalizeBlocks(value: unknown): BlogArticleBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((block): BlogArticleBlock | null => {
      if (!block || typeof block !== "object") return null;
      const candidate = block as { heading?: unknown; paragraphs?: unknown; visual?: unknown };
      if (typeof candidate.heading !== "string" || !Array.isArray(candidate.paragraphs)) return null;

      const paragraphs = candidate.paragraphs
        .filter((paragraph): paragraph is string => typeof paragraph === "string")
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      if (!candidate.heading.trim() || paragraphs.length === 0) return null;

      return {
        heading: candidate.heading.trim(),
        paragraphs,
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
    alt?: unknown;
    caption?: unknown;
  };
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const brief = typeof candidate.brief === "string" ? candidate.brief.trim() : "";
  const kind = typeof candidate.kind === "string" ? candidate.kind.trim() : "";

  if (!title || !brief) return undefined;

  return {
    title,
    kind: ["diagram", "table", "checklist", "comparison"].includes(kind)
      ? (kind as NonNullable<BlogArticleBlock["visual"]>["kind"])
      : "diagram",
    brief,
    alt: typeof candidate.alt === "string" ? candidate.alt.trim() : undefined,
    caption: typeof candidate.caption === "string" ? candidate.caption.trim() : undefined,
  };
}

function ensureAffiliatePlacement(
  article: Omit<BlogArticle, "id">,
  affiliateProducts: AffiliateProduct[],
): Omit<BlogArticle, "id"> {
  const markers = collectAffiliateMarkers(article.blocks);
  if (markers.length > 0) {
    return {
      ...article,
      metadata: {
        ...article.metadata,
        affiliateLinks: markers,
      },
    };
  }

  const product = selectAffiliateProduct(article, affiliateProducts);
  if (!product) return article;

  return {
    ...article,
    blocks: insertAffiliateMarker(article.blocks, product.id),
    metadata: {
      ...article.metadata,
      affiliateLinks: [product.id],
      affiliateInsertedByFallback: true,
    },
  };
}

function selectAffiliateProduct(article: Omit<BlogArticle, "id">, affiliateProducts: AffiliateProduct[]) {
  const text = `${article.keyword} ${article.title} ${article.excerpt} ${article.blocks
    .flatMap((block) => [block.heading, ...block.paragraphs])
    .join(" ")}`.toLowerCase();
  const category = categoryToProductCategory(article.category);
  const categoryProducts = affiliateProducts.filter((product) => product.category === category);
  const candidates = categoryProducts.length ? categoryProducts : affiliateProducts;

  return (
    candidates.find((product) =>
      [product.name, product.maker, product.genre, ...product.keywords].some((keyword) =>
        text.includes(keyword.toLowerCase()),
      ),
    ) ??
    categoryProducts[0] ??
    affiliateProducts[0]
  );
}

function insertAffiliateMarker(blocks: BlogArticleBlock[], productId: string) {
  if (!blocks.length) return blocks;
  const insertIndex = blocks.length >= 3 ? 1 : 0;

  return blocks.map((block, index) => {
    if (index !== insertIndex) return block;
    const paragraphs = [...block.paragraphs];
    const position = Math.min(1, paragraphs.length);
    paragraphs.splice(position, 0, `{{affiliate:${productId}}}`);
    return { ...block, paragraphs };
  });
}

function collectAffiliateMarkers(blocks: BlogArticleBlock[]) {
  return Array.from(
    new Set(
      blocks.flatMap((block) =>
        block.paragraphs
          .map((paragraph) => paragraph.trim().match(/^\{\{affiliate:([a-z0-9-]+)\}\}$/)?.[1])
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  );
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

function categoryToProductCategory(category: string): ProductCategory {
  const normalized = normalizeCategory(category);
  const map: Record<string, ProductCategory> = {
    rack: "power-rack",
    dumbbell: "adjustable-dumbbell",
    bench: "bench",
    floor: "floor-mat",
    compact: "compact-gym",
    guide: "floor-mat",
  };
  return map[normalized] ?? "floor-mat";
}

function imageForCategory(category: string) {
  return fallbackImages[normalizeCategory(category)] ?? fallbackImages.guide;
}

function createArticleTags(keyword: string, category: string) {
  const categoryTagById: Record<string, string> = {
    guide: "作り方",
    rack: "パワーラック",
    dumbbell: "可変式ダンベル",
    bench: "ベンチ",
    floor: "床材・防音",
    compact: "省スペース",
  };
  const candidates = [keyword, categoryTagById[normalizeCategory(category)]].filter(Boolean);
  return Array.from(new Set(candidates)).slice(0, 5);
}

function imageModel() {
  return OPENAI_IMAGE_MODEL;
}

function openAiApiKey() {
  const value = process.env.OPENAI_API_KEY?.trim();
  if (!value || value === "\"\"" || value === "''") return "";
  return value.replace(/^["']|["']$/g, "");
}

function requiresGeneratedImages() {
  return true;
}
