import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
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
const BLOG_IMAGE_MAX_WIDTH = 1200;
const BLOG_IMAGE_WEBP_QUALITY = 74;
const MAX_AFFILIATE_LINKS_PER_ARTICLE = 3;

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
            content: buildArticlePromptV2(keyword, affiliateProducts),
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
  const bytes = Buffer.from(base64, "base64");
  const articleSlug = slug.split("-inline-")[0] ?? slug;
  const fileName = `${slug}.webp`;
  const publicPath = `/blog/${articleSlug}/${fileName}`;
  const outputPath = path.join(process.cwd(), "public", "blog", articleSlug, fileName);

  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, await optimizeBlogImage(bytes));
    return publicPath;
  } catch (error) {
    console.error("Failed to store generated blog image", error);
    return null;
  }
}

async function optimizeBlogImage(bytes: Buffer) {
  return sharp(bytes)
    .rotate()
    .resize({ width: BLOG_IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: BLOG_IMAGE_WEBP_QUALITY, effort: 6 })
    .toBuffer();
}

function buildArticlePromptV2(keyword: KeywordCandidate, affiliateProducts: AffiliateProduct[]) {
  return `あなたは日本語のホームジム専門メディア「My Home Gym」の編集者です。
これから自宅にトレーニング環境を作る人、または自宅用の筋トレ器具を選ぶ人に向けて、検索意図に正面から答える実用記事を書いてください。

検索キーワード: ${keyword.keyword}
想定カテゴリ: ${keyword.category}
${buildAffiliatePromptSection(affiliateProducts)}

記事の条件:
- 本文は日本語のみ。
- 検索キーワードをタイトル、導入、少なくとも1つの見出しに自然に含める。
- 結論を先に書き、その後に選び方、注意点、失敗回避、代替案を具体的に説明する。
- サイズ、重量、設置条件、床保護、防音、予算、レビュー数など、購入前に判断できる情報を優先する。
- 医療的・断定的な効果保証、過度な販売表現は避ける。
- 商品カードは1記事につき最大3つ。本文で個別商品の詳細、価格、サイズ、重量、レビュー、設置条件などに触れる場合は、その商品に対応する {{affiliate:商品ID}} を必ず直後または同じ小見出し内の自然な位置に置く。
- 複数の商品を比較・紹介する場合は、本文で具体的に説明した商品ごとに商品カードを入れる。1つだけに絞らない。
- 商品カードを入れる場合は、直前の段落で判断軸を説明してから {{affiliate:商品ID}} を単独段落として置く。
- JSONだけを返す。Markdownや説明文は不要。

JSON形式:
{
  "title": "32文字前後のSEOタイトル",
  "excerpt": "80文字前後の要約",
  "category": "guide | rack | dumbbell | bench | floor | compact のいずれか",
  "readingMinutes": 4,
  "blocks": [
    {
      "heading": "具体的な見出し",
      "paragraphs": ["本文段落", "{{affiliate:category-rank}}", "本文段落"],
      "visual": {
        "title": "図表タイトル",
        "kind": "diagram | table | checklist | comparison",
        "brief": "画像で説明する具体的な内容。数値、比較軸、配置、チェック項目を含める",
        "alt": "画像の代替テキスト",
        "caption": "短い補足"
      }
    }
  ]
}

blocksは4から6個。各paragraphsは1から3段落。visualは本文理解に役立つ2ブロックだけに付けてください。`;
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

function normalizeBlocks(value: unknown): BlogArticleBlock[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((block): BlogArticleBlock | null => {
      if (!isRecord(block) || typeof block.heading !== "string" || !Array.isArray(block.paragraphs)) return null;

      const paragraphs = block.paragraphs
        .filter((paragraph): paragraph is string => typeof paragraph === "string")
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      if (!block.heading.trim() || !paragraphs.length) return null;

      const normalized: BlogArticleBlock = {
        heading: block.heading.trim(),
        paragraphs,
      };
      const visual = normalizeVisual(block.visual);
      if (visual) normalized.visual = visual;
      return normalized;
    })
    .filter((block): block is BlogArticleBlock => Boolean(block));
}

function normalizeVisual(value: unknown): BlogArticleBlock["visual"] | undefined {
  if (!isRecord(value)) return undefined;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const brief = typeof value.brief === "string" ? value.brief.trim() : "";
  if (!title || !brief) return undefined;

  const kind = typeof value.kind === "string" ? value.kind : "diagram";

  return {
    title,
    kind: ["diagram", "table", "checklist", "comparison"].includes(kind)
      ? (kind as NonNullable<BlogArticleBlock["visual"]>["kind"])
      : "diagram",
    brief,
    alt: typeof value.alt === "string" ? value.alt.trim() : undefined,
    caption: typeof value.caption === "string" ? value.caption.trim() : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  const title = `${keyword.keyword}で失敗しないホームジム環境の作り方`;
  const blocks: BlogArticleBlock[] = [
    {
      heading: "最初に決めるのは器具ではなく使い方",
      paragraphs: [
        "ホームジム作りでは、最初に買う器具よりも、週に何回どの種目を行うかを決めることが大切です。ベンチプレス、スクワット、ダンベル種目、懸垂など、中心にする種目によって必要な広さ、床対策、予算が変わります。",
        "特にラックやベンチを置く場合は、本体サイズだけでなく、プレート交換、ダンベルを置く場所、体を回り込ませる余白まで含めて考える必要があります。",
      ],
    },
    {
      heading: "予算は本体価格だけで見ない",
      paragraphs: [
        "器具本体が安く見えても、床材、防音マット、バーベル、プレート、工具、送料まで含めると総額は変わります。可変式ダンベル中心なら初期費用を抑えやすく、ラック構成なら後から拡張しやすいのが強みです。",
      ],
      visual: {
        title: "初期費用の見積もりポイント",
        kind: "table",
        brief: "本体器具、床対策、周辺小物の3項目に分けて、予算の見落としを比較する表。各項目に目安と注意点を入れる。",
        alt: "ホームジムの初期費用を項目別に比較した表",
        caption: "本体価格だけでなく、床対策と周辺小物まで見ておくと予算感がつかみやすくなります。",
      },
    },
    {
      heading: "目的に合う器具を一つずつ足す",
      paragraphs: [
        "省スペースなら可変式ダンベルとベンチ、本格的にBIG3を行うならラックと床対策が候補になります。いきなり全部そろえるより、最初にやる種目を決めて不足する器具だけ足すほうが、部屋も予算も圧迫しにくくなります。",
      ],
      visual: {
        title: "目的別の器具選び",
        kind: "diagram",
        brief: "省スペース、自重・懸垂、BIG3の3パターンに分け、必要器具と設置注意点を示すフローチャート。",
        alt: "目的別にホームジム器具を選ぶフローチャート",
        caption: "先に目的を決めると、買うべき器具の優先順位が整理できます。",
      },
    },
    {
      heading: "設置前に部屋の条件を確認する",
      paragraphs: [
        "賃貸、持ち家、ガレージ、ワンルームでは最適解が変わります。幅、奥行き、高さ、可動域、収納場所をメジャーで確認し、写真付きの実例やランキングを見比べると、自分の部屋で再現できるか判断しやすくなります。",
      ],
    },
  ];

  return {
    slug: createSlug(keyword, title),
    title,
    excerpt: `${keyword.keyword}をテーマに、広さ、予算、器具選び、床対策までホームジム作りの判断ポイントを整理します。`,
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
function ensureAffiliatePlacement(
  article: Omit<BlogArticle, "id">,
  affiliateProducts: AffiliateProduct[],
): Omit<BlogArticle, "id"> {
  const normalizedBlocks = keepAffiliateMarkers(article.blocks, affiliateProducts, MAX_AFFILIATE_LINKS_PER_ARTICLE);
  const markers = collectAffiliateMarkers(normalizedBlocks);
  if (markers.length > 0) {
    return {
      ...article,
      blocks: normalizedBlocks,
      metadata: {
        ...article.metadata,
        affiliateLinks: markers,
      },
    };
  }

  const products = selectAffiliateProducts(article, affiliateProducts, MAX_AFFILIATE_LINKS_PER_ARTICLE);
  if (!products.length) return article;

  return {
    ...article,
    blocks: insertAffiliateMarkers(article.blocks, products.map((product) => product.id)),
    metadata: {
      ...article.metadata,
      affiliateLinks: products.map((product) => product.id),
      affiliateInsertedByFallback: true,
    },
  };
}

function selectAffiliateProducts(
  article: Omit<BlogArticle, "id">,
  affiliateProducts: AffiliateProduct[],
  limit: number,
) {
  const text = `${article.keyword} ${article.title} ${article.excerpt} ${article.blocks
    .flatMap((block) => [block.heading, ...block.paragraphs])
    .join(" ")}`.toLowerCase();
  const category = categoryToProductCategory(article.category);
  const categoryProducts = affiliateProducts.filter((product) => product.category === category);
  const candidates = categoryProducts.length ? categoryProducts : affiliateProducts;

  const scored = candidates
    .map((product) => {
      const matches = [product.name, product.maker, product.genre, ...product.keywords].filter((keyword) =>
        text.includes(keyword.toLowerCase()),
      );
      return {
        product,
        score: matches.length * 10 + Math.max(0, 6 - product.rank),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.product.rank - b.product.rank)
    .map((item) => item.product);

  const fallback = categoryProducts.length ? categoryProducts : affiliateProducts;
  return Array.from(new Map([...scored, ...fallback].map((product) => [product.id, product])).values()).slice(0, limit);
}

function insertAffiliateMarkers(blocks: BlogArticleBlock[], productIds: string[]) {
  if (!blocks.length) return blocks;
  const uniqueProductIds = Array.from(new Set(productIds)).slice(0, MAX_AFFILIATE_LINKS_PER_ARTICLE);
  const startIndex = blocks.length >= 3 ? 1 : 0;

  return blocks.map((block, index) => {
    const productId = uniqueProductIds[index - startIndex];
    if (!productId) return block;
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

function keepAffiliateMarkers(blocks: BlogArticleBlock[], affiliateProducts: AffiliateProduct[], limit: number) {
  const allowedIds = new Set(affiliateProducts.map((product) => product.id));
  const seenIds = new Set<string>();

  return blocks.map((block) => ({
    ...block,
    paragraphs: block.paragraphs.filter((paragraph) => {
      const markerId = paragraph.trim().match(/^\{\{affiliate:([a-z0-9-]+)\}\}$/)?.[1];
      if (!markerId) return true;
      if (!allowedIds.has(markerId) || seenIds.has(markerId) || seenIds.size >= limit) return false;
      seenIds.add(markerId);
      return true;
    }),
  }));
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



