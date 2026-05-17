import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = "https://cxmutmoxmbfbrnwctppm.supabase.co";
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
const CLAUDE_TIMEOUT_MS = 60_000;
const ARTICLE_LIMIT = Number(getArgValue("--limit") ?? "200");
const APPLY = process.argv.includes("--apply");
const ALLOW_EXISTING = process.argv.includes("--allow-existing");
const TARGET_PRODUCT_ID = getArgValue("--product");

loadEnvFile(".env.local");

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!serviceRoleKey) fail("SUPABASE_SERVICE_ROLE_KEY is required.");
if (!anthropicApiKey) fail("ANTHROPIC_API_KEY is required.");

const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { persistSession: false },
});

const affiliateProducts = await loadAffiliateProducts();

if (affiliateProducts.length === 0) fail("No active affiliate products found in Supabase.");
if (TARGET_PRODUCT_ID && !affiliateProducts.some((product) => product.id === TARGET_PRODUCT_ID)) {
  fail(`Unknown affiliate product id: ${TARGET_PRODUCT_ID}`);
}

const { data: articles, error } = await supabase
  .from("blog_articles")
  .select("id,slug,title,excerpt,keyword,category,tags,blocks,metadata")
  .order("published_at", { ascending: false })
  .limit(Math.max(1, Math.min(ARTICLE_LIMIT, 1000)));

if (error) fail(`Failed to load blog articles: ${error.message}`);
if (!articles?.length) {
  console.log("No blog articles found.");
  process.exit(0);
}

let changed = 0;
let skipped = 0;

for (const article of articles) {
  const blocks = normalizeBlocks(article.blocks);

  if (!blocks.length) {
    skipped += 1;
    console.log(`[skip] ${article.slug}: no valid blocks`);
    continue;
  }

  if (hasAffiliateMarker(blocks) && !ALLOW_EXISTING) {
    skipped += 1;
    console.log(`[skip] ${article.slug}: affiliate marker already exists`);
    continue;
  }

  if (TARGET_PRODUCT_ID && collectAffiliateMarkers(blocks).includes(TARGET_PRODUCT_ID)) {
    skipped += 1;
    console.log(`[skip] ${article.slug}: target product already exists`);
    continue;
  }

  const nextBlocks = await proposeAffiliateBlocks(article, blocks);
  if (!nextBlocks || !hasAffiliateMarker(nextBlocks)) {
    skipped += 1;
    console.log(`[skip] ${article.slug}: no suitable affiliate placement`);
    continue;
  }

  if (JSON.stringify(nextBlocks) === JSON.stringify(blocks)) {
    skipped += 1;
    console.log(`[skip] ${article.slug}: no affiliate changes`);
    continue;
  }

  const markers = collectAffiliateMarkers(nextBlocks);
  changed += 1;
  console.log(`[change] ${article.slug}: ${markers.join(", ")}`);

  if (!APPLY) continue;

  const { error: updateError } = await supabase
    .from("blog_articles")
    .update({
      blocks: nextBlocks,
      updated_at: new Date().toISOString(),
      metadata: {
        ...(isPlainObject(article.metadata) ? article.metadata : {}),
        affiliateLinksEnrichedAt: new Date().toISOString(),
        affiliateLinks: markers,
      },
    })
    .eq("id", article.id);

  if (updateError) fail(`Failed to update ${article.slug}: ${updateError.message}`);
}

console.log(APPLY ? `Updated ${changed} articles. Skipped ${skipped}.` : `Dry run: ${changed} articles would change. Skipped ${skipped}.`);
if (!APPLY) console.log("Run with --apply to update Supabase.");

async function proposeAffiliateBlocks(article, blocks) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4200,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: buildPrompt(article, blocks),
        },
      ],
    }),
    signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.warn(
      `[fallback] Claude request failed for ${article.slug}: ${response.status} ${message.slice(0, 180)}`,
    );
    return insertFallbackAffiliateMarker(article, blocks);
  }

  const payload = await response.json();
  const text = payload?.content?.find((part) => part?.type === "text")?.text;
  if (typeof text !== "string") return insertFallbackAffiliateMarker(article, blocks);

  const parsed = parseJson(text);
  const nextBlocks = normalizeBlocks(parsed?.blocks);
  if (!nextBlocks.length) return insertFallbackAffiliateMarker(article, blocks);

  return sanitizeAffiliateMarkers(nextBlocks);
}

function buildPrompt(article, blocks) {
  const existingMarkers = collectAffiliateMarkers(blocks);
  const promptProducts = TARGET_PRODUCT_ID
    ? affiliateProducts.filter((product) => product.id === TARGET_PRODUCT_ID)
    : affiliateProducts;

  return `あなたは日本語のホームジム記事の編集者です。
既存記事を読み、本文の適切な位置に画像付きアソシエイト商品カード用のマーカーを挿入してください。

ルール:
- 記事内容に自然に合う商品だけ入れる。無理に入れない。
- 挿入するときは paragraphs 配列に単独文字列として {{affiliate:カテゴリ-順位}} を入れる。
- カテゴリ-順位は下記の商品一覧にあるidだけ使う。
- 同じidは1記事で1回だけ。
- 既存の商品カードマーカーは削除しない。すでに入っているidは追加しない。
- 原則1商品だけ。記事全体で明確に複数器具を比較・初期セット提案している場合だけ最大2商品まで。
- 3商品すべてを入れるのは、記事が「パワーラック、可変式ダンベル、ベンチの3点セット」そのものを主題にしている場合だけ。
- 床材、防音、広さ、予算が主題の記事では、床材・防振マット商品が自然に合う位置を優先する。器具リンクは無理に入れない。
- 具体的にラック・ダンベル・ベンチの選び方に触れている段落の近くには、その器具に合う商品だけ入れる。
- 既存の文章はできるだけ変更しない。文章の書き換えより、適切な位置へのマーカー挿入を優先する。
- JSONだけ返す。説明文やMarkdownは返さない。
- blocks以外の情報は返さない。

既存の商品カード:
${existingMarkers.length ? existingMarkers.join(", ") : "なし"}

商品一覧:
${JSON.stringify(
  promptProducts.map((product) => ({
    id: product.id,
    category: product.category,
    rank: product.rank,
    genre: product.genre,
    name: product.name,
    maker: product.maker,
    keywords: product.keywords,
    targetContexts: product.targetContexts,
    avoidContexts: product.avoidContexts,
    recommendedAnchorKeywords: product.recommendedAnchorKeywords,
    placementNote: product.placementNote,
    productRole: product.productRole,
    suitableFor: product.suitableFor,
    notSuitableFor: product.notSuitableFor,
    priority: product.priority,
  })),
  null,
  2,
)}

記事:
${JSON.stringify(
  {
    title: article.title,
    excerpt: article.excerpt,
    keyword: article.keyword,
    category: article.category,
    tags: article.tags,
    blocks,
  },
  null,
  2,
)}

返すJSON:
{
  "blocks": [
    {
      "heading": "元の見出し",
      "paragraphs": ["元の本文", "{{affiliate:カテゴリ-順位}}", "元の本文"],
      "visual": { "元のvisualがあればそのまま" }
    }
  ]
}`;
}

function sanitizeAffiliateMarkers(blocks) {
  const allowedIds = new Set(affiliateProducts.map((product) => product.id));
  const usedIds = new Set();

  return blocks.map((block) => ({
    ...block,
    paragraphs: block.paragraphs.filter((paragraph) => {
      const id = getAffiliateMarkerId(paragraph);
      if (!id) return true;
      if (!allowedIds.has(id) || usedIds.has(id)) return false;
      usedIds.add(id);
      return true;
    }),
  }));
}

function insertFallbackAffiliateMarker(article, blocks) {
  const product = selectFallbackProduct(article, blocks);
  if (!product) return null;

  const insertIndex = findBestInsertBlockIndex(article, blocks, product);
  return sanitizeAffiliateMarkers(
    blocks.map((block, index) => {
      if (index !== insertIndex) return block;
      const paragraphs = [...block.paragraphs];
      const position = Math.min(1, paragraphs.length);
      paragraphs.splice(position, 0, `{{affiliate:${product.id}}}`);
      return { ...block, paragraphs };
    }),
  );
}

function selectFallbackProduct(article, blocks) {
  if (TARGET_PRODUCT_ID) {
    return affiliateProducts.find((product) => product.id === TARGET_PRODUCT_ID) ?? null;
  }

  const text = `${article.title} ${article.excerpt} ${article.keyword} ${article.category} ${blocks
    .flatMap((block) => [block.heading, ...block.paragraphs])
    .join(" ")}`.toLowerCase();
  const category = categoryToProductCategory(article.category, text);
  const categoryProducts = affiliateProducts.filter((product) => product.category === category);
  const candidates = categoryProducts.length ? categoryProducts : affiliateProducts;

  return (
    candidates.find((product) =>
      [product.name, product.maker, product.genre, ...product.keywords].some((keyword) =>
        text.includes(String(keyword).toLowerCase()),
      ),
    ) ??
    categoryProducts[0] ??
    affiliateProducts[0] ??
    null
  );
}

function findBestInsertBlockIndex(article, blocks, product) {
  const productTerms = [product.name, product.maker, product.genre, ...product.keywords].map((term) =>
    String(term).toLowerCase(),
  );
  const bestIndex = blocks.findIndex((block) => {
    const text = `${block.heading} ${block.paragraphs.join(" ")}`.toLowerCase();
    return productTerms.some((term) => text.includes(term));
  });
  if (bestIndex >= 0) return bestIndex;
  if (article.category === "bench" || article.category === "dumbbell" || article.category === "rack") return Math.min(1, blocks.length - 1);
  return Math.min(2, blocks.length - 1);
}

function categoryToProductCategory(category, text) {
  if (category === "rack" || hasAny(text, ["ラック", "スミスマシン", "懸垂", "ベンチプレス"])) return "power-rack";
  if (category === "dumbbell" || hasAny(text, ["ダンベル", "重量変更"])) return "adjustable-dumbbell";
  if (category === "bench" || hasAny(text, ["ベンチ", "インクライン"])) return "bench";
  if (category === "floor" || hasAny(text, ["床", "マット", "防音", "防振"])) return "floor-mat";
  return "floor-mat";
}

function normalizeBlocks(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((block) => {
      if (!isPlainObject(block) || typeof block.heading !== "string" || !Array.isArray(block.paragraphs)) {
        return null;
      }

      const normalized = {
        heading: block.heading,
        paragraphs: block.paragraphs
          .filter((paragraph) => typeof paragraph === "string")
          .map((paragraph) => paragraph.trim())
          .filter(Boolean),
      };

      if (isPlainObject(block.visual)) normalized.visual = block.visual;
      return normalized.paragraphs.length ? normalized : null;
    })
    .filter(Boolean);
}

function hasAffiliateMarker(blocks) {
  return collectAffiliateMarkers(blocks).length > 0;
}

function collectAffiliateMarkers(blocks) {
  return Array.from(
    new Set(
      blocks.flatMap((block) =>
        block.paragraphs.map((paragraph) => getAffiliateMarkerId(paragraph)).filter(Boolean),
      ),
    ),
  );
}

function getAffiliateMarkerId(text) {
  return text.trim().match(/^\{\{affiliate:([a-z0-9-]+)\}\}$/)?.[1] ?? null;
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

async function loadAffiliateProducts() {
  const { data, error } = await supabase
    .from("amazon_associate_links")
    .select(
      "slot_key,category,rank,genre,product_name,maker,keywords,target_contexts,avoid_contexts,recommended_anchor_keywords,placement_note,product_role,suitable_for,not_suitable_for,priority",
    )
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("category", { ascending: true })
    .order("rank", { ascending: true });

  if (error) fail(`Failed to load affiliate products: ${error.message}`);

  return (data ?? []).map((product) => ({
    id: product.slot_key,
    category: product.category,
    rank: product.rank,
    genre: product.genre ?? "",
    name: product.product_name,
    maker: product.maker,
    keywords: product.keywords ?? [],
    targetContexts: product.target_contexts ?? [],
    avoidContexts: product.avoid_contexts ?? [],
    recommendedAnchorKeywords: product.recommended_anchor_keywords ?? [],
    placementNote: product.placement_note ?? "",
    productRole: product.product_role ?? "",
    suitableFor: product.suitable_for ?? [],
    notSuitableFor: product.not_suitable_for ?? [],
    priority: product.priority ?? 100,
  }));
}

function loadEnvFile(relativePath) {
  const filePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function getArgValue(name) {
  const entry = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return entry?.slice(name.length + 1);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasAny(value, needles) {
  return needles.some((needle) => value.includes(needle));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
