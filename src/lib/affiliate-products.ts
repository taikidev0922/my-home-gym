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

export function formatAffiliateProductsForPrompt(products: AffiliateProduct[]) {
  return products
    .map((product) => {
      const keywords = product.keywords.join(", ");
      const anchors = product.recommendedAnchorKeywords.join(", ");
      const targetContexts = product.targetContexts.join(" / ");
      const avoidContexts = product.avoidContexts.join(" / ") || "なし";
      const suitableFor = product.suitableFor.join(" / ");
      const notSuitableFor = product.notSuitableFor.join(" / ") || "なし";

      return [
        `- id: ${product.id}`,
        `カテゴリ: ${product.category}`,
        `順位: ${product.rank}`,
        `役割: ${product.productRole || product.genre}`,
        `商品: ${product.name} (${product.maker})`,
        `向く文脈: ${targetContexts}`,
        `避ける文脈: ${avoidContexts}`,
        `近くにあると自然な語: ${anchors || keywords}`,
        `向いている読者: ${suitableFor}`,
        `向かない読者: ${notSuitableFor}`,
        `挿入メモ: ${product.placementNote}`,
        `関連語: ${keywords}`,
      ].join(" / ");
    })
    .join("\n");
}

export function buildAffiliatePromptSection(products: AffiliateProduct[]) {
  if (!products.length) return "";

  return `
アソシエイト商品カード方針:
- 以下の商品が記事内容に自然に合う場合だけ、画像付き商品カードとして挿入する。
- 挿入するときは paragraphs 内に単独の文字列として {{affiliate:カテゴリ-順位}} を入れる。
- 例: "{{affiliate:power-rack-1}}"
- カテゴリ-順位は下記の商品一覧にあるidだけ使う。
- 同じidを同一記事内で重複させない。
- 最大3商品まで。関係が薄い記事では無理に入れない。
- 商品の「向く文脈」「避ける文脈」「挿入メモ」を見て、どの商品をどの段落近くに置くか判断する。
- 販売色の強い表現ではなく、器具選びの参考カードとして自然に配置する。
- JSON構造は崩さず、paragraphsの文字列内にだけ入れる。Markdownリンクではなく、必ず {{affiliate:カテゴリ-順位}} を使う。

利用できる商品リンク:
${formatAffiliateProductsForPrompt(products)}
`;
}
