import { affiliateProducts, type AffiliateProduct } from "@/lib/affiliate-products";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductCategory } from "@/lib/types";

type AmazonAssociateLinkRow = {
  slot_key: string;
  category: ProductCategory;
  rank: number;
  legacy_product_id: string | null;
  genre: string | null;
  product_name: string;
  maker: string;
  affiliate_url: string;
  image_url: string;
  keywords: string[] | null;
};

function rowToAffiliateProduct(row: AmazonAssociateLinkRow): AffiliateProduct {
  return {
    id: row.slot_key,
    slotKey: row.slot_key,
    legacyProductId: row.legacy_product_id ?? row.slot_key,
    category: row.category,
    rank: row.rank,
    genre: row.genre ?? "",
    name: row.product_name,
    maker: row.maker,
    affiliateUrl: row.affiliate_url,
    imageUrl: row.image_url,
    keywords: row.keywords ?? [],
  };
}

function getStaticAffiliateProductById(id: string) {
  return affiliateProducts.find((product) => product.id === id || product.legacyProductId === id) ?? null;
}

export async function getAffiliateProducts() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return affiliateProducts;

  const { data, error } = await supabase
    .from("amazon_associate_links")
    .select("slot_key, category, rank, legacy_product_id, genre, product_name, maker, affiliate_url, image_url, keywords")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("rank", { ascending: true });

  if (error || !data?.length) {
    if (error) console.warn("Failed to load amazon associate links from Supabase", error.message);
    return affiliateProducts;
  }

  return (data as AmazonAssociateLinkRow[]).map(rowToAffiliateProduct);
}

export async function getAffiliateProductById(id: string) {
  const products = await getAffiliateProducts();
  return products.find((product) => product.id === id || product.legacyProductId === id) ?? getStaticAffiliateProductById(id);
}

export async function getAffiliateProductsByIds(ids: string[]) {
  if (!ids.length) return new Map<string, AffiliateProduct>();

  const products = await getAffiliateProducts();
  const productMap = new Map<string, AffiliateProduct>();

  for (const id of ids) {
    const product = products.find((item) => item.id === id || item.legacyProductId === id) ?? getStaticAffiliateProductById(id);
    if (product) productMap.set(id, product);
  }

  return productMap;
}
