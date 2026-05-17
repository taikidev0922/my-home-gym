import affiliateProductsJson from "@/data/affiliate-products.json";
import type { ProductCategory } from "@/lib/types";

type AffiliateProductJson = {
  id: string;
  category: ProductCategory;
  genre: string;
  name: string;
  maker: string;
  affiliateUrl: string;
  imageUrl: string;
  keywords: string[];
};

export type AffiliateProduct = {
  id: string;
  slotKey: string;
  legacyProductId: string;
  category: ProductCategory;
  rank: number;
  genre: string;
  name: string;
  maker: string;
  affiliateUrl: string;
  imageUrl: string;
  keywords: string[];
};

export const affiliateSlotAssignments = [
  { legacyProductId: "wasai-mk780-half-rack", category: "power-rack", rank: 1 },
  { legacyProductId: "barwing-hhr01-half-rack", category: "power-rack", rank: 2 },
  { legacyProductId: "irotec-multi-power-rack", category: "power-rack", rank: 3 },
  { legacyProductId: "lysin-helixmirror-40kg", category: "adjustable-dumbbell", rank: 1 },
  { legacyProductId: "flexbell-20kg-2kg-pair", category: "adjustable-dumbbell", rank: 2 },
  { legacyProductId: "barwing-adjustable-dumbbell-24kg-pair", category: "adjustable-dumbbell", rank: 3 },
  { legacyProductId: "barwing-bw-ajb06-bench", category: "bench", rank: 1 },
  { legacyProductId: "gogojump-folding-training-bench", category: "bench", rank: 2 },
  { legacyProductId: "barwing-dc04-training-bench", category: "bench", rank: 3 },
  { legacyProductId: "airhop-joint-mat", category: "floor-mat", rank: 1 },
  { legacyProductId: "kawashima-structural-plywood-12mm", category: "floor-mat", rank: 2 },
  { legacyProductId: "showa-eva-joint-mat-12mm", category: "floor-mat", rank: 3 },
] as const satisfies readonly {
  legacyProductId: string;
  category: ProductCategory;
  rank: number;
}[];

const slotByLegacyProductId = new Map<string, (typeof affiliateSlotAssignments)[number]>(
  affiliateSlotAssignments.map((assignment) => [assignment.legacyProductId, assignment]),
);

export function createAffiliateSlotKey(category: ProductCategory, rank: number) {
  return `${category}-${rank}`;
}

function toAffiliateProduct(product: AffiliateProductJson): AffiliateProduct | null {
  const slot = slotByLegacyProductId.get(product.id);
  if (!slot) return null;

  const slotKey = createAffiliateSlotKey(slot.category, slot.rank);

  return {
    id: slotKey,
    slotKey,
    legacyProductId: product.id,
    category: slot.category,
    rank: slot.rank,
    genre: product.genre,
    name: product.name,
    maker: product.maker,
    affiliateUrl: product.affiliateUrl,
    imageUrl: product.imageUrl,
    keywords: product.keywords,
  };
}

export const affiliateProducts = (affiliateProductsJson as AffiliateProductJson[])
  .map(toAffiliateProduct)
  .filter((product): product is AffiliateProduct => Boolean(product));

export function getAffiliateProductById(id: string) {
  return affiliateProducts.find((product) => product.id === id || product.legacyProductId === id) ?? null;
}

export function getStaticAffiliateUrlById(id: string) {
  return getAffiliateProductById(id)?.affiliateUrl;
}

export function formatAffiliateProductsForPrompt() {
  return affiliateProducts
    .map((product) => {
      const keywords = product.keywords.join(", ");
      return `- id: ${product.id} / ${product.genre}: ${product.name} (${product.maker}) / ${product.affiliateUrl} / 関連語: ${keywords}`;
    })
    .join("\n");
}

export function buildAffiliatePromptSection() {
  if (!affiliateProducts.length) return "";

  return `
アソシエイト商品カード方針:
- 以下の商品が記事内容に自然に合う場合だけ、画像付き商品カードとして挿入する。
- 挿入するときは paragraphs 内に単独の文字列として {{affiliate:カテゴリ-順位}} を入れる。
- 例: "{{affiliate:power-rack-1}}"
- カテゴリ-順位は下記の商品一覧にあるidだけ使う。
- 同じidを同一記事内で重複させない。
- 最大3商品まで。関係が薄い記事では無理に入れない。
- 販売色の強い表現ではなく、器具選びの参考カードとして自然に配置する。
- JSON構造は崩さず、paragraphsの文字列内にだけ入れる。Markdownリンクではなく、必ず {{affiliate:カテゴリ-順位}} を使う。

利用できる商品リンク:
${formatAffiliateProductsForPrompt()}
`;
}
