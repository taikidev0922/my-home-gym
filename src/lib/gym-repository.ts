import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productCategoryLabels } from "@/lib/product-rankings";
import type { GymScale, HomeGymPost, PostCategoryItem, ProductCategory } from "@/lib/types";

type GymPostRow = {
  id: string;
  title: string;
  slug: string;
  scale: GymScale;
  area_tatami: number;
  budget: number;
  summary: string;
  tags: string[] | null;
  published?: boolean;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    x_url: string | null;
  } | null;
  gym_post_images: Array<{
    storage_path: string;
    alt: string;
    sort_order: number;
  }> | null;
  gym_post_categories: Array<{
    category: ProductCategory;
  }> | null;
  post_likes: Array<{ user_id: string }> | null;
};

export type ProfileData = {
  displayName: string;
  avatarUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  xUrl: string;
};

export type PostSearchFilters = {
  query?: string;
  scale?: GymScale;
  maxBudget?: number;
  maxArea?: number;
  categories?: ProductCategory[];
  page?: number;
  perPage?: number;
};

export type PublishedPostsResult = {
  posts: HomeGymPost[];
  total: number;
  page: number;
  perPage: number;
};

export type PostSitemapEntry = {
  slug: string;
  lastModified: string;
};

const postSelect = `
  id,
  title,
  slug,
  scale,
  area_tatami,
  budget,
  summary,
  tags,
  published,
  profiles!gym_posts_user_id_fkey(display_name, avatar_url, instagram_url, tiktok_url, x_url),
  gym_post_images(storage_path, alt, sort_order),
  gym_post_categories(category),
  post_likes(user_id)
`;

export async function getPublishedPosts(filters: PostSearchFilters = {}): Promise<PublishedPostsResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const perPage = Math.min(48, Math.max(1, Math.floor(filters.perPage ?? 12)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  if (!supabase) {
    return { posts: [], total: 0, page, perPage };
  }

  let postIds: string[] | undefined;
  if (filters.categories?.length) {
    const { data: categoryRows, error: categoryError } = await supabase
      .from("gym_post_categories")
      .select("post_id")
      .in("category", filters.categories);

    if (categoryError || !categoryRows) {
      console.error("Failed to load post categories", categoryError);
      return { posts: [], total: 0, page, perPage };
    }

    postIds = Array.from(new Set(categoryRows.map((row) => row.post_id)));
    if (postIds.length === 0) return { posts: [], total: 0, page, perPage };
  }

  let query = supabase
    .from("gym_posts")
    .select(postSelect, { count: "exact" })
    .eq("published", true);

  if (filters.scale) {
    query = query.eq("scale", filters.scale);
  }

  if (typeof filters.maxBudget === "number") {
    query = query.lte("budget", filters.maxBudget);
  }

  if (typeof filters.maxArea === "number") {
    query = query.lte("area_tatami", filters.maxArea);
  }

  if (postIds) {
    query = query.in("id", postIds);
  }

  const keyword = normalizeSearchTerm(filters.query);
  if (keyword) {
    const pattern = `%${keyword}%`;
    query = query.or(`title.ilike.${pattern},summary.ilike.${pattern}`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error("Failed to load gym posts", error);
    return { posts: [], total: 0, page, perPage };
  }

  if (data.length === 0 && count && page > 1) {
    return getPublishedPosts({
      ...filters,
      page: Math.ceil(count / perPage),
      perPage,
    });
  }

  return {
    posts: (data as unknown as GymPostRow[]).map(mapPostRow),
    total: count ?? 0,
    page,
    perPage,
  };
}

function normalizeSearchTerm(value?: string) {
  return value?.replace(/[,%]/g, " ").trim() ?? "";
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("gym_posts")
    .select(postSelect)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to load gym post", error);
    return null;
  }

  return mapPostRow(data as unknown as GymPostRow);
}

export async function getPublishedPostSitemapEntries(limit = 50000): Promise<PostSitemapEntry[]> {
  const supabase = await createSupabaseServerClient();
  const entries: PostSitemapEntry[] = [];
  const pageSize = 1000;
  const maxRows = Math.max(1, Math.min(limit, 50000));

  if (!supabase) return entries;

  for (let from = 0; from < maxRows; from += pageSize) {
    const to = Math.min(from + pageSize - 1, maxRows - 1);
    const { data, error } = await supabase
      .from("gym_posts")
      .select("slug,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data) {
      console.error("Failed to load post sitemap entries", error);
      break;
    }

    entries.push(
      ...data.map((row) => ({
        slug: String(row.slug),
        lastModified: String(row.created_at),
      })),
    );

    if (data.length < pageSize) break;
  }

  return entries;
}

export async function getUserPosts(userId: string): Promise<HomeGymPost[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("gym_posts")
    .select(postSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to load user posts", error);
    return [];
  }

  return (data as unknown as GymPostRow[]).map(mapPostRow);
}

export async function getLikedPosts(userId: string): Promise<HomeGymPost[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("post_likes")
    .select(`gym_posts(${postSelect})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to load liked posts", error);
    return [];
  }

  return (data as unknown as Array<{ gym_posts: GymPostRow | null }>)
    .map((row) => row.gym_posts)
    .filter((post): post is GymPostRow => Boolean(post))
    .map(mapPostRow);
}

export async function getProfile(userId: string, fallbackEmail?: string): Promise<ProfileData> {
  const fallbackName = fallbackEmail?.split("@")[0] ?? "ユーザー";
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      displayName: fallbackName,
      avatarUrl: "",
      instagramUrl: "",
      tiktokUrl: "",
      xUrl: "",
    };
  }

  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, instagram_url, tiktok_url, x_url")
    .eq("id", userId)
    .maybeSingle();

  return {
    displayName: data?.display_name ?? fallbackName,
    avatarUrl: data?.avatar_url ?? "",
    instagramUrl: data?.instagram_url ?? "",
    tiktokUrl: data?.tiktok_url ?? "",
    xUrl: data?.x_url ?? "",
  };
}

function mapPostRow(row: GymPostRow): HomeGymPost {
  const images = [...(row.gym_post_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.storage_path);

  const gear: PostCategoryItem[] = (row.gym_post_categories ?? []).map((item) => ({
    category: item.category,
    name: productCategoryLabels[item.category] ?? item.category,
  }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    owner: row.profiles?.display_name ?? "投稿者",
    ownerAvatarUrl: row.profiles?.avatar_url ?? undefined,
    scale: row.scale,
    areaTatami: Number(row.area_tatami),
    budget: row.budget,
    tags: row.tags ?? [],
    summary: row.summary,
    images: images.length ? images : ["/window.svg"],
    gear,
    sns: {
      instagram: row.profiles?.instagram_url ?? undefined,
      tiktok: row.profiles?.tiktok_url ?? undefined,
      x: row.profiles?.x_url ?? undefined,
    },
    likes: row.post_likes?.length ?? 0,
  };
}
