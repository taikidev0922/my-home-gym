import type { ProductCategory } from "@/lib/types";

export type AffiliateProduct = {
  id: string;
  slotKey: string;
  category: ProductCategory;
  rank: number;
  genre: string;
  name: string;
  maker: string;
  affiliateUrl: string;
  imageUrl: string;
  asin: string;
  sourceUrl: string;
  priceText: string;
  ratingText: string;
  reviewCountText: string;
  brand: string;
  sellerText: string;
  availabilityText: string;
  dimensionsText: string;
  weightText: string;
  featureBullets: string[];
  productDescription: string;
  specTable: Record<string, string>;
  detailSections: Record<string, string>;
  scrapedFacts: Record<string, unknown>;
  rawScrapedJson: Record<string, unknown>;
  scrapedAt: string;
  keywords: string[];
  targetContexts: string[];
  avoidContexts: string[];
  recommendedAnchorKeywords: string[];
  placementNote: string;
  productRole: string;
  suitableFor: string[];
  notSuitableFor: string[];
  priority: number;
};

export function createAffiliateSlotKey(category: ProductCategory, rank: number) {
  return `${category}-${rank}`;
}

function compactJson(value: Record<string, unknown> | Record<string, string>) {
  const entries = Object.entries(value).filter(([, entryValue]) => {
    if (entryValue == null) return false;
    if (typeof entryValue === "string") return entryValue.trim().length > 0;
    if (Array.isArray(entryValue)) return entryValue.length > 0;
    if (typeof entryValue === "object") return Object.keys(entryValue).length > 0;
    return true;
  });

  if (!entries.length) return "なし";
  return JSON.stringify(Object.fromEntries(entries));
}

function joinList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(" / ") || "なし";
}

export function formatAffiliateProductsForPrompt(products: AffiliateProduct[]) {
  return products
    .map((product) => {
      const keywords = joinList(product.keywords);
      const anchors = joinList(product.recommendedAnchorKeywords);
      const targetContexts = joinList(product.targetContexts);
      const avoidContexts = joinList(product.avoidContexts);
      const suitableFor = joinList(product.suitableFor);
      const notSuitableFor = joinList(product.notSuitableFor);
      const featureBullets = joinList(product.featureBullets);
      const specTable = compactJson(product.specTable);
      const detailSections = compactJson(product.detailSections);
      const scrapedFacts = compactJson(product.scrapedFacts);

      return [
        `- id: ${product.id}`,
        `カテゴリ: ${product.category}`,
        `カテゴリ表示名: ${product.genre}`,
        `順位: ${product.rank}`,
        `商品名: ${product.name}`,
        `メーカー/ストア: ${product.maker}`,
        `ブランド: ${product.brand || "なし"}`,
        `ASIN: ${product.asin || "なし"}`,
        `価格: ${product.priceText || "なし"}`,
        `評価: ${product.ratingText || "なし"}`,
        `レビュー数: ${product.reviewCountText || "なし"}`,
        `在庫/配送: ${product.availabilityText || "なし"}`,
        `販売元: ${product.sellerText || "なし"}`,
        `サイズ: ${product.dimensionsText || "なし"}`,
        `重量: ${product.weightText || "なし"}`,
        `Amazon特徴: ${featureBullets}`,
        `Amazon商品説明: ${product.productDescription || "なし"}`,
        `Amazon仕様表: ${specTable}`,
        `Amazon詳細セクション: ${detailSections}`,
        `抽出済みfacts: ${scrapedFacts}`,
        `自然なアンカー候補: ${anchors === "なし" ? keywords : anchors}`,
        `関連キーワード: ${keywords}`,
        `向く文脈(手入力補助): ${targetContexts}`,
        `避ける文脈(手入力補助): ${avoidContexts}`,
        `向いている読者(手入力補助): ${suitableFor}`,
        `向かない読者(手入力補助): ${notSuitableFor}`,
        `挿入メモ(手入力補助): ${product.placementNote || "なし"}`,
      ].join(" / ");
    })
    .join("\n");
}

export function buildAffiliatePromptSection(products: AffiliateProduct[]) {
  if (!products.length) return "";

  return `
アソシエイト商品カード方針:
- 商品カードは1記事につき最大1つだけ挿入する。
- 複数の商品が候補になる場合でも、その時の文章・検索意図・読者の悩みに最も当てはめやすい1商品だけを選ぶ。
- 関係が薄い記事では無理に入れない。ただし記事内容に自然に合う商品がある場合は、1つだけ商品カードを入れる。
- 挿入するときは paragraphs 内に単独の文字列として {{affiliate:カテゴリ-順位}} を入れる。例: "{{affiliate:power-rack-1}}"
- カテゴリ-順位は下の商品一覧にある id だけを使う。
- 同じ id を同一記事内で重複させない。
- 商品選定では、Amazonから取得した商品名、特徴、商品説明、仕様表、サイズ、重量、価格、評価、レビュー数、在庫/配送を最優先で使う。
- 「向く文脈」「避ける文脈」「挿入メモ」は手入力の補助情報なので、Amazon取得情報と記事本文の一致を優先して判断する。
- 読者が購入前に判断しやすいよう、商品カード直前の段落ではサイズ感、設置条件、用途、注意点、代替案のいずれかに自然に触れる。
- 商品カード直前の段落は、読者が「この条件を満たす商品を確認したい」と思える導線にする。迷いやすい条件、確認すべきスペック、失敗回避の観点を示してからカードへつなげる。
- クリックを促す目的はあるが、「今すぐ買うべき」「絶対おすすめ」などの強い販売表現は避ける。読者の不安や比較ポイントを解消して、自然に商品詳細を見たくなる文章にする。
- 販売色の強い表現ではなく、器具選びの参考カードとして自然に配置する。
- JSON構造は崩さず、paragraphs の文字列配列内にだけ入れる。Markdownリンクではなく、必ず {{affiliate:カテゴリ-順位}} を使う。

利用できる商品リンク:
${formatAffiliateProductsForPrompt(products)}
`;
}
