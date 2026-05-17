import type { SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateProduct } from "@/lib/affiliate-products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductCategory } from "@/lib/types";

type AmazonAssociateLinkRow = {
  slot_key: string;
  category: ProductCategory;
  rank: number;
  genre: string | null;
  product_name: string;
  maker: string;
  affiliate_url: string;
  image_url: string;
  keywords: string[] | null;
  target_contexts: string[] | null;
  avoid_contexts: string[] | null;
  recommended_anchor_keywords: string[] | null;
  placement_note: string | null;
  product_role: string | null;
  suitable_for: string[] | null;
  not_suitable_for: string[] | null;
  priority: number | null;
};

const affiliateProductSelect = `
  slot_key,
  category,
  rank,
  genre,
  product_name,
  maker,
  affiliate_url,
  image_url,
  keywords,
  target_contexts,
  avoid_contexts,
  recommended_anchor_keywords,
  placement_note,
  product_role,
  suitable_for,
  not_suitable_for,
  priority
`;

function rowToAffiliateProduct(row: AmazonAssociateLinkRow): AffiliateProduct {
  return {
    id: row.slot_key,
    slotKey: row.slot_key,
    category: row.category,
    rank: row.rank,
    genre: row.genre ?? "",
    name: row.product_name,
    maker: row.maker,
    affiliateUrl: row.affiliate_url,
    imageUrl: row.image_url,
    keywords: row.keywords ?? [],
    targetContexts: row.target_contexts ?? [],
    avoidContexts: row.avoid_contexts ?? [],
    recommendedAnchorKeywords: row.recommended_anchor_keywords ?? [],
    placementNote: row.placement_note ?? "",
    productRole: row.product_role ?? "",
    suitableFor: row.suitable_for ?? [],
    notSuitableFor: row.not_suitable_for ?? [],
    priority: row.priority ?? 100,
  };
}

async function loadAffiliateProducts(client: SupabaseClient | null) {
  if (!client) return [];

  const { data, error } = await client
    .from("amazon_associate_links")
    .select(affiliateProductSelect)
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("category", { ascending: true })
    .order("rank", { ascending: true });

  if (error) {
    console.error("Failed to load amazon associate links from Supabase", error);
    return [];
  }

  return ((data ?? []) as AmazonAssociateLinkRow[]).map(rowToAffiliateProduct);
}

export async function getAffiliateProducts() {
  return loadAffiliateProducts(await createSupabaseServerClient());
}

export async function getAffiliateProductsForGeneration() {
  return loadAffiliateProducts(createSupabaseAdminClient());
}

export async function getAffiliateProductById(id: string) {
  const products = await getAffiliateProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function getAffiliateProductsByIds(ids: string[]) {
  const productMap = new Map<string, AffiliateProduct>();
  if (!ids.length) return productMap;

  const products = await getAffiliateProducts();
  const allowedIds = new Set(ids);

  for (const product of products) {
    if (allowedIds.has(product.id)) productMap.set(product.id, product);
  }

  return productMap;
}
