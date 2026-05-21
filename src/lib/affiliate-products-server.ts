import { affiliateProducts } from "@/data/affiliate-products";
import type { ProductCategory } from "@/lib/types";

export async function getAffiliateProducts() {
  return affiliateProducts;
}

export async function getAffiliateProductsForGeneration() {
  return affiliateProducts;
}

export async function getAffiliateProductById(id: string) {
  return affiliateProducts.find((product) => product.id === id) ?? null;
}

export async function getAffiliateProductsByIds(ids: string[]) {
  const allowedIds = new Set(ids);
  const productMap = new Map<string, (typeof affiliateProducts)[number]>();

  for (const product of affiliateProducts) {
    if (allowedIds.has(product.id)) productMap.set(product.id, product);
  }

  return productMap;
}

export async function getAffiliateProductsByCategory(category: ProductCategory) {
  return affiliateProducts.filter((product) => product.category === category);
}
