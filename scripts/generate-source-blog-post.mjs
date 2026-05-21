import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ROOT = process.cwd();
const BLOG_DATA_PATH = path.join(ROOT, "src", "data", "blog-articles.ts");
const AFFILIATE_DATA_PATH = path.join(ROOT, "src", "data", "affiliate-products.ts");
const BLOG_IMAGE_ROOT = path.join(ROOT, "public", "blog");

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const CLAUDE_TIMEOUT_MS = 180_000;
const RAKKO_API_BASE_URL = "https://api.rakkokeyword.com";
const RAKKO_KEYWORD_FETCH_LIMIT = 20;
const DRY_RUN = process.argv.includes("--dry-run");
const BLOG_IMAGE_MAX_WIDTH = 1200;
const BLOG_IMAGE_WEBP_QUALITY = 74;

const keywordSeedGroups = {
  guide: ["ホームジム 器具", "家トレ 器具", "筋トレ 部屋", "ホームジム 予算", "ホームジム 広さ", "ホームジム 作り方"],
  rack: ["パワーラック", "ハーフラック", "スミスマシン 自宅", "パワーラック 必要スペース", "パワーラック 床 補強"],
  dumbbell: ["可変式ダンベル", "可変式ダンベル 選び方", "可変式ダンベル 40kg", "ダンベル 家トレ", "ダンベルプレス ベンチ"],
  bench: ["トレーニングベンチ", "インクラインベンチ", "アジャスタブルベンチ", "ベンチプレス ベンチ 自宅"],
  floor: ["ジムマット 防音", "ジョイントマット 筋トレ", "ホームジム 床材", "ダンベル 床 防音", "賃貸 筋トレ 防音"],
  compact: ["省スペース 筋トレ器具", "狭い部屋 筋トレ", "懸垂マシン 省スペース", "折りたたみ ベンチ", "チューブ 筋トレ 自宅"],
};
const fallbackKeywords = Object.entries(keywordSeedGroups).flatMap(([category, keywords]) =>
  keywords.map((keyword) => ({ keyword, category })),
);

await loadEnvFile(".env.local");

if (!process.env.ANTHROPIC_API_KEY) fail("ANTHROPIC_API_KEY is required.");
if (!DRY_RUN && !process.env.OPENAI_API_KEY) fail("OPENAI_API_KEY is required.");

const existingArticles = await readDataArray(BLOG_DATA_PATH, "blogArticles");
const affiliateProducts = await readDataArray(AFFILIATE_DATA_PATH, "affiliateProducts");

const keyword = await selectKeyword(existingArticles);
const generated = await generateArticleWithClaude(keyword, affiliateProducts);
const articleWithAffiliate = ensureAffiliatePlacement(generated, affiliateProducts);
const article = DRY_RUN ? articleWithAffiliate : await generateAndAttachImages(articleWithAffiliate);

if (DRY_RUN) {
  console.log(JSON.stringify({ keyword, article }, null, 2));
  process.exit(0);
}

await appendArticle(article);
console.log(`Generated source blog article: ${article.slug}`);

async function generateArticleWithClaude(keyword, products) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 5000,
      temperature: 0.55,
      messages: [
        {
          role: "user",
          content: buildArticlePrompt(keyword, products),
        },
      ],
    }),
    signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    fail(`Claude article request failed: ${response.status} ${message.slice(0, 300)}`);
  }

  const payload = await response.json();
  const text = payload?.content?.find((part) => part?.type === "text")?.text;
  const parsed = typeof text === "string" ? parseJson(text) : null;
  if (!parsed) fail("Claude response did not contain valid JSON.");

  const blocks = normalizeBlocks(parsed.blocks);
  if (!parsed.title || !parsed.excerpt || !blocks.length) fail("Claude response is missing required article fields.");

  const now = new Date().toISOString();
  const category = normalizeArticleCategory(String(parsed.category || keyword.category));

  return {
    id: crypto.randomUUID(),
    slug: createSlug(keyword, parsed.title),
    title: String(parsed.title).trim(),
    excerpt: String(parsed.excerpt).trim(),
    keyword: keyword.keyword,
    category,
    tags: createArticleTags(keyword.keyword, category),
    imageUrl: "",
    readingMinutes: Number(parsed.readingMinutes) || estimateReadingMinutes(blocks),
    publishedAt: now,
    updatedAt: now,
    articleSource: "claude",
    keywordSource: keyword.source,
    blocks,
    metadata: {
      generatedAt: now,
      keywordMetrics: keyword.metrics,
      keywordScore: keyword.score,
      generator: "source-blog-action",
    },
  };
}

function buildArticlePrompt(keyword, products) {
  return `You are the editor of a Japanese home gym media site called My Home Gym.
Write a practical Japanese blog article for people building or improving a home gym.

Search keyword: ${keyword.keyword}
Expected category: ${keyword.category}

Affiliate card rules:
- Insert at most one affiliate card marker in the article.
- Use only ids from the product list below.
- Insert the marker as a standalone paragraph inside paragraphs, for example "{{affiliate:power-rack-1}}".
- Choose a product only when it naturally helps the reader decide. Avoid hard-sell language.
- Right before the marker, explain the relevant decision point such as size, weight, setup conditions, price range, reviews, or failure avoidance.
- Prioritize scraped Amazon facts, specs, size, weight, price, rating, review count, and availability over guesswork.

Available affiliate products:
${formatProductsForPrompt(products)}

Article quality rules:
- Japanese only.
- Avoid exaggerated claims and medical certainty.
- Start with a useful conclusion.
- Make each section concrete and decision-oriented.
- Include two visual specs. They should be useful infographic ideas, not decorative photos.
- Return JSON only. No markdown fences.

JSON shape:
{
  "title": "title around 32 Japanese characters",
  "excerpt": "summary around 80 Japanese characters",
  "category": "guide | rack | dumbbell | bench | floor | compact",
  "readingMinutes": 4,
  "blocks": [
    {
      "heading": "specific section heading",
      "paragraphs": ["body paragraph", "{{affiliate:category-rank}}", "body paragraph"],
      "visual": {
        "title": "visual title",
        "kind": "diagram | table | checklist | comparison",
        "brief": "specific content to show in the image",
        "alt": "alt text",
        "caption": "short caption"
      }
    }
  ]
}

Create 4 to 6 blocks. Each block should have 1 to 3 paragraphs. Add visual to exactly two blocks.`;
}

function formatProductsForPrompt(products) {
  return products
    .map((product) => {
      const compact = {
        id: product.id,
        category: product.category,
        rank: product.rank,
        genre: product.genre,
        name: product.name,
        maker: product.maker,
        asin: product.asin,
        priceText: product.priceText,
        ratingText: product.ratingText,
        reviewCountText: product.reviewCountText,
        availabilityText: product.availabilityText,
        dimensionsText: product.dimensionsText,
        weightText: product.weightText,
        featureBullets: (product.featureBullets || []).slice(0, 8),
        productDescription: product.productDescription,
        specTable: product.specTable,
        keywords: product.keywords,
        targetContexts: product.targetContexts,
        avoidContexts: product.avoidContexts,
        placementNote: product.placementNote,
      };
      return JSON.stringify(compact);
    })
    .join("\n");
}

async function generateAndAttachImages(article) {
  const candidates = article.blocks.filter((block) => block.visual).slice(0, 2);
  if (candidates.length < 2) fail("Generated article must include two visual blocks.");

  await fs.mkdir(path.join(BLOG_IMAGE_ROOT, article.slug), { recursive: true });
  const imageUrls = new Map();

  for (let index = 0; index < candidates.length; index += 1) {
    const block = candidates[index];
    const fileName = `image-${String(index + 1).padStart(2, "0")}.webp`;
    const outputPath = path.join(BLOG_IMAGE_ROOT, article.slug, fileName);
    const bytes = await generateImage(article, block.visual);
    await fs.writeFile(outputPath, await optimizeBlogImage(bytes));
    imageUrls.set(block.heading, `/blog/${article.slug}/${fileName}`);
  }

  const blocks = article.blocks.map((block) => {
    const imageUrl = imageUrls.get(block.heading);
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

  return {
    ...article,
    imageUrl: imageUrls.values().next().value || "",
    blocks,
    metadata: {
      ...article.metadata,
      imageModel: OPENAI_IMAGE_MODEL,
      imageSource: "source-blog-action",
      inlineVisualCount: imageUrls.size,
      affiliateLinks: collectAffiliateMarkers(blocks),
    },
  };
}

async function generateImage(article, visual) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: buildImagePrompt(article, visual),
      quality: "high",
      output_format: "webp",
      n: 1,
    }),
    signal: AbortSignal.timeout(260_000),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    fail(`OpenAI image request failed: ${response.status} ${message.slice(0, 300)}`);
  }

  const payload = await response.json();
  const base64 = payload?.data?.[0]?.b64_json;
  if (typeof base64 !== "string") fail("OpenAI image response did not contain b64_json.");
  return Buffer.from(base64, "base64");
}

async function optimizeBlogImage(bytes) {
  return sharp(bytes)
    .rotate()
    .resize({ width: BLOG_IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: BLOG_IMAGE_WEBP_QUALITY, effort: 6 })
    .toBuffer();
}

function buildImagePrompt(article, visual) {
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

async function appendArticle(article) {
  const articles = await readDataArray(BLOG_DATA_PATH, "blogArticles");
  if (articles.some((item) => item.slug === article.slug)) fail(`Article already exists: ${article.slug}`);

  await writeDataArray(
    BLOG_DATA_PATH,
    "BlogArticle",
    "blogArticles",
    [article, ...articles].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
  );
}

async function selectKeyword(articles) {
  const used = new Set(articles.map((article) => normalizeKeyword(article.keyword)));
  const rakko = await fetchRakkoKeywordCandidates(articles);
  const rakkoCandidate = rakko.candidates.find((candidate) => !used.has(normalizeKeyword(candidate.keyword)));
  if (rakkoCandidate) return rakkoCandidate;

  const fallback =
    fallbackKeywords.find((item) => !used.has(normalizeKeyword(item.keyword))) ??
    fallbackKeywords[articles.length % fallbackKeywords.length];

  return {
    keyword: used.has(normalizeKeyword(fallback.keyword)) ? `${fallback.keyword} ${articles.length + 1}` : fallback.keyword,
    source: rakko.source === "rakko" ? "fallback-after-rakko-empty" : rakko.source,
    category: fallback.category,
    metrics: {},
  };
}

async function fetchRakkoKeywordCandidates(articles) {
  const apiKey = process.env.RAKKO_KEYWORD_API_KEY;
  if (!apiKey) return { source: "rakko-missing-key", candidates: [] };

  const seed = selectSeedKeyword(articles);
  try {
    const response = await fetch(`${RAKKO_API_BASE_URL}/v1/related-keywords`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        keyword: seed,
        matchType: "partialMatch",
        sortBy: "searchVolume",
        orderBy: "desc",
        filter: { searchVolume: { min: 10 } },
        limit: RAKKO_KEYWORD_FETCH_LIMIT,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.result) return { source: `rakko-error-${response.status}`, candidates: [] };

    const candidates = (payload.data?.items ?? [])
      .filter((item) => item?.keyword)
      .map((item) => ({
        keyword: String(item.keyword),
        source: "rakko",
        category: inferArticleCategory(String(item.keyword)),
        metrics: item.metrics ?? {},
      }))
      .filter(isHomeGymKeyword)
      .map((item) => ({ ...item, score: scoreKeywordCandidate(item) }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => normalizeKeyword(entry.keyword) === normalizeKeyword(item.keyword)) === index,
      );

    return { source: candidates.length ? `rakko:${seed}` : `rakko-empty:${seed}`, candidates };
  } catch {
    return { source: "rakko-fetch-error", candidates: [] };
  }
}

function ensureAffiliatePlacement(article, products) {
  const normalizedBlocks = keepFirstAffiliateMarker(article.blocks, products);
  const markers = collectAffiliateMarkers(normalizedBlocks);
  if (markers.length > 0) {
    return {
      ...article,
      blocks: normalizedBlocks,
      metadata: { ...article.metadata, affiliateLinks: markers.slice(0, 1) },
    };
  }

  const product = selectAffiliateProduct(article, products);
  if (!product) return article;
  const blocks = insertAffiliateMarker(article.blocks, product.id);

  return {
    ...article,
    blocks,
    metadata: { ...article.metadata, affiliateLinks: [product.id], affiliateInsertedByFallback: true },
  };
}

function selectAffiliateProduct(article, products) {
  const text = `${article.keyword} ${article.title} ${article.excerpt} ${article.blocks
    .flatMap((block) => [block.heading, ...block.paragraphs])
    .join(" ")}`.toLowerCase();
  const category = articleCategoryToProductCategory(article.category, text);
  const categoryProducts = products.filter((product) => product.category === category);
  const candidates = categoryProducts.length ? categoryProducts : products;

  return (
    candidates.find((product) =>
      [product.name, product.maker, product.genre, ...(product.keywords || [])].some((keyword) =>
        text.includes(String(keyword).toLowerCase()),
      ),
    ) ??
    categoryProducts[0] ??
    products[0] ??
    null
  );
}

function insertAffiliateMarker(blocks, productId) {
  if (!blocks.length) return blocks;
  const insertIndex = blocks.length >= 3 ? 1 : 0;

  return blocks.map((block, index) => {
    if (index !== insertIndex) return block;
    const paragraphs = [...block.paragraphs];
    paragraphs.splice(Math.min(1, paragraphs.length), 0, `{{affiliate:${productId}}}`);
    return { ...block, paragraphs };
  });
}

function keepFirstAffiliateMarker(blocks, products) {
  const allowedIds = new Set(products.map((product) => product.id));
  let hasMarker = false;

  return blocks.map((block) => ({
    ...block,
    paragraphs: block.paragraphs.filter((paragraph) => {
      const markerId = getAffiliateMarkerId(paragraph);
      if (!markerId) return true;
      if (hasMarker || !allowedIds.has(markerId)) return false;
      hasMarker = true;
      return true;
    }),
  }));
}

function collectAffiliateMarkers(blocks) {
  return Array.from(
    new Set(blocks.flatMap((block) => block.paragraphs.map(getAffiliateMarkerId).filter(Boolean))),
  );
}

function getAffiliateMarkerId(text) {
  return String(text).trim().match(/^\{\{affiliate:([a-z0-9-]+)\}\}$/)?.[1] ?? null;
}

function normalizeBlocks(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      if (!isPlainObject(block) || typeof block.heading !== "string" || !Array.isArray(block.paragraphs)) return null;
      const paragraphs = block.paragraphs
        .filter((paragraph) => typeof paragraph === "string")
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
      if (!block.heading.trim() || !paragraphs.length) return null;

      const normalized = { heading: block.heading.trim(), paragraphs };
      const visual = normalizeVisual(block.visual);
      if (visual) normalized.visual = visual;
      return normalized;
    })
    .filter(Boolean);
}

function normalizeVisual(value) {
  if (!isPlainObject(value)) return undefined;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const brief = typeof value.brief === "string" ? value.brief.trim() : "";
  if (!title || !brief) return undefined;

  return {
    title,
    kind: ["diagram", "table", "checklist", "comparison"].includes(value.kind) ? value.kind : "diagram",
    brief,
    alt: typeof value.alt === "string" ? value.alt.trim() : undefined,
    caption: typeof value.caption === "string" ? value.caption.trim() : undefined,
  };
}

async function readDataArray(filePath, exportName) {
  const contents = await fs.readFile(filePath, "utf8");
  const startPattern = new RegExp(`export const ${exportName}: [^=]+ = `);
  const match = contents.match(startPattern);
  if (!match || match.index == null) fail(`Could not find ${exportName} export in ${filePath}`);

  const arrayStart = contents.indexOf("[", match.index + match[0].length);
  const arrayEnd = contents.lastIndexOf("];");
  if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) fail(`Could not parse ${exportName} array.`);

  return JSON.parse(contents.slice(arrayStart, arrayEnd + 1));
}

async function writeDataArray(filePath, typeName, exportName, values) {
  const body = `import type { ${typeName} } from "@/lib/types";\n\nexport const ${exportName}: ${typeName}[] = ${JSON.stringify(values, null, 2)};\n`;
  await fs.writeFile(filePath, body, "utf8");
}

function createSlug(keyword, title) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const category = normalizeArticleCategory(keyword.category);
  const hash = createShortHash(`${keyword.keyword}:${title}:${Date.now()}`);
  return `home-gym-${category}-${date}-${hash}`;
}

function createShortHash(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 8);
}

function estimateReadingMinutes(blocks) {
  const chars = blocks.reduce((total, block) => total + block.heading.length + block.paragraphs.join("").length, 0);
  return Math.max(3, Math.ceil(chars / 600));
}

function createArticleTags(keyword, category) {
  const categoryTagById = {
    guide: "作り方",
    rack: "パワーラック",
    dumbbell: "可変式ダンベル",
    bench: "ベンチ",
    floor: "床材・防音",
    compact: "省スペース",
  };
  return Array.from(new Set([keyword, categoryTagById[normalizeArticleCategory(category)]].filter(Boolean))).slice(0, 5);
}
function normalizeArticleCategory(category) {
  return ["guide", "rack", "dumbbell", "bench", "floor", "compact"].includes(category) ? category : "guide";
}

function articleCategoryToProductCategory(category, text) {
  if (category === "rack" || hasAny(text, ["ラック", "スミスマシン", "懸垂", "ベンチプレス"])) return "power-rack";
  if (category === "dumbbell" || hasAny(text, ["ダンベル", "重量変更"])) return "adjustable-dumbbell";
  if (category === "bench" || hasAny(text, ["ベンチ", "インクライン"])) return "bench";
  if (category === "floor" || hasAny(text, ["床", "マット", "防音", "防振"])) return "floor-mat";
  if (category === "compact" || hasAny(text, ["省スペース", "狭い", "折りたたみ", "チューブ", "ミラー"])) return "compact-gym";
  return "floor-mat";
}

function inferArticleCategory(keyword) {
  if (hasAny(keyword, ["パワーラック", "ハーフラック", "スミスマシン", "懸垂"])) return "rack";
  if (hasAny(keyword, ["可変式ダンベル", "ダンベル"])) return "dumbbell";
  if (hasAny(keyword, ["ベンチ", "インクライン", "アジャスタブル"])) return "bench";
  if (hasAny(keyword, ["床", "マット", "防音", "防振", "ジョイントマット"])) return "floor";
  if (hasAny(keyword, ["省スペース", "狭い", "折りたたみ", "チューブ", "ミラー"])) return "compact";
  return "guide";
}
function isHomeGymKeyword(candidate) {
  const keyword = normalizeKeyword(candidate.keyword);
  if (keyword.length < 4 || keyword.length > 80) return false;
  if (hasAny(keyword, ["退会", "ログイン", "中古車", "求人", "株価"])) return false;
  return hasAny(keyword, [
    "ホームジム",
    "家トレ",
    "自宅トレ",
    "筋トレ器具",
    "パワーラック",
    "ダンベル",
    "ベンチ",
    "トレーニングマット",
    "防音",
    "床",
    "懸垂",
  ]);
}

function scoreKeywordCandidate(candidate) {
  const keyword = normalizeKeyword(candidate.keyword);
  const metrics = candidate.metrics || {};
  const volume = Number(metrics.searchVolume ?? metrics.monthlySearches ?? 0);
  const competition = Number(metrics.competition ?? 0);
  const intentScore = keywordIntentScore(keyword, [
    "おすすめ",
    "選び方",
    "費用",
    "予算",
    "広さ",
    "作り方",
    "6畳",
    "4畳",
    "賃貸",
    "防音",
    "床",
    "マット",
    "比較",
    "初心者",
    "自宅",
    "必要",
    "目安",
    "レイアウト",
  ]);
  const longTailScore = keyword.length >= 8 ? 12 : 0;
  const categoryScore = candidate.category === "guide" ? 2 : 8;
  const volumeScore = Math.min(35, Math.log10(Math.max(volume, 1)) * 12);
  const competitionPenalty = Number.isFinite(competition) ? Math.min(10, competition * 2) : 0;

  return Math.round(volumeScore + intentScore + longTailScore + categoryScore - competitionPenalty);
}
function keywordIntentScore(keyword, terms) {
  return terms.reduce((score, term) => score + (keyword.includes(term) ? 8 : 0), 0);
}

function selectSeedKeyword(articles) {
  const orderedCategories = Object.keys(keywordSeedGroups);
  const categoryCounts = new Map(orderedCategories.map((category) => [category, 0]));

  for (const article of articles) {
    const category = inferArticleCategory(article.keyword);
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  const lastCategory = articles[0]?.keyword ? inferArticleCategory(articles[0].keyword) : null;
  const category = [...orderedCategories].sort((a, b) => {
    const countDiff = (categoryCounts.get(a) ?? 0) - (categoryCounts.get(b) ?? 0);
    if (countDiff !== 0) return countDiff;
    if (a === lastCategory) return 1;
    if (b === lastCategory) return -1;
    return orderedCategories.indexOf(a) - orderedCategories.indexOf(b);
  })[0];

  const seeds = keywordSeedGroups[category] || keywordSeedGroups.guide;
  return seeds[(categoryCounts.get(category) ?? 0) % seeds.length];
}

function parseJson(text) {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) return null;
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

async function loadEnvFile(relativePath) {
  try {
    const contents = await fs.readFile(path.resolve(ROOT, relativePath), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // CI provides env vars through secrets.
  }
}

function normalizeKeyword(keyword) {
  return String(keyword).replace(/\s+/g, " ").trim();
}

function hasAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}




