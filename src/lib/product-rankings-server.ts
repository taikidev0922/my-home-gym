import { createAffiliateSlotKey } from "@/lib/affiliate-products";
import { getAffiliateProductsByIds } from "@/lib/affiliate-products-server";
import { getRankingProducts } from "@/lib/product-rankings";
import type { ProductCategory } from "@/lib/types";

export async function getRankingProductsWithAffiliateLinks(category?: ProductCategory) {
  const products = getRankingProducts(category);
  const slotKeys = products.map((product) => createAffiliateSlotKey(product.category, product.rank));
  const affiliateProductsBySlot = await getAffiliateProductsByIds(slotKeys);

  return products.map((product) => {
    const slotKey = createAffiliateSlotKey(product.category, product.rank);
    const affiliateProduct = affiliateProductsBySlot.get(slotKey);

    if (!affiliateProduct) return product;

    return {
      ...product,
      name: affiliateProduct.name,
      maker: affiliateProduct.maker,
      image: affiliateProduct.imageUrl,
      affiliateUrl: affiliateProduct.affiliateUrl,
      productUrl: affiliateProduct.affiliateUrl,
      isAffiliate: true,
    };
  });
}
