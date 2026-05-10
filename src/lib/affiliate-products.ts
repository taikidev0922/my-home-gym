import affiliateProductsJson from "@/data/affiliate-products.json";
import type { ProductCategory } from "@/lib/types";

export type AffiliateProduct = {
  id: string;
  category: ProductCategory;
  genre: string;
  name: string;
  maker: string;
  affiliateUrl: string;
  imageUrl: string;
  keywords: string[];
};

export const affiliateProducts = affiliateProductsJson as AffiliateProduct[];

export function getAffiliateProductById(id: string) {
  return affiliateProducts.find((product) => product.id === id);
}

export function getAffiliateUrlById(id: string) {
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

  return `\nアソシエイト商品カード方針:
- 以下の商品を、記事内容に自然に合う場合だけ画像付き商品カードとして挿入する。
- 挿入するときはparagraphs内に単独の文字列として {{affiliate:商品id}} を入れる。
- 例: "{{affiliate:wasai-mk780-half-rack}}"
- 同じ商品idを同一記事内で重複させない。
- 最大3商品まで。関係が薄い記事では無理に入れない。
- 販売色の強い表現ではなく、器具選びの参考カードとして自然に配置する。
- JSON構造は崩さず、paragraphsの文字列内にだけ入れる。Markdownリンクではなく、必ず {{affiliate:商品id}} を使う。

利用できる商品リンク:
${formatAffiliateProductsForPrompt()}
`;
}
