import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth-user";
import { getRankingCategories } from "@/lib/product-rankings";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GymScale, ProductCategory } from "@/lib/types";

export const runtime = "nodejs";

const gymScales = new Set<GymScale>(["compact", "standard", "serious"]);
const productCategories = new Set<ProductCategory>(getRankingCategories());
const loginRequiredMessage = "ログインが必要です。";
const notFoundMessage = "投稿が見つかりません。";
const invalidInputMessage = "入力内容を確認してください。";
const serverErrorMessage = "サーバー設定に問題があります。時間をおいて再度お試しください。";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UploadedPostImage = {
  publicUrl: string;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: loginRequiredMessage }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const { id } = await params;
  const existingPost = await findOwnedPost(id, user.id);
  if (!existingPost) {
    return NextResponse.json({ error: notFoundMessage }, { status: 404 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const areaTatami = Number(formData.get("areaTatami") ?? 0);
  const budget = Number(formData.get("budget") ?? 0);
  const scaleValue = String(formData.get("scale") ?? "compact");
  const scale: GymScale = gymScales.has(scaleValue as GymScale) ? (scaleValue as GymScale) : "compact";
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseJsonStringArray(formData.get("tags"));
  const uploadedImages = parseUploadedImages(formData.get("uploadedImages"));
  const categories = parseJsonStringArray(formData.get("categories")).filter((category): category is ProductCategory =>
    productCategories.has(category as ProductCategory),
  );
  const thumbnailIndex = Math.max(0, Number(formData.get("thumbnailIndex") ?? 0));

  if (!title || !description || !Number.isFinite(areaTatami) || areaTatami <= 0 || !Number.isFinite(budget) || budget < 0 || !uploadedImages.length) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  const { error: postError } = await supabase
    .from("gym_posts")
    .update({
      title,
      scale,
      area_tatami: areaTatami,
      budget,
      summary: description,
      tags,
      published: true,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (postError) {
    console.error("Failed to update gym post", postError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const orderedImages = moveItemToFront(uploadedImages, thumbnailIndex);
  const imageRows = orderedImages.map((image, index) => ({
    post_id: id,
    storage_path: image.publicUrl,
    alt: `${title} ${index + 1}`,
    sort_order: index,
  }));

  const { error: deleteImagesError } = await supabase.from("gym_post_images").delete().eq("post_id", id);
  if (deleteImagesError) {
    console.error("Failed to replace gym post images", deleteImagesError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const { error: imageError } = await supabase.from("gym_post_images").insert(imageRows);
  if (imageError) {
    console.error("Failed to update gym post image rows", imageError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const { error: deleteCategoriesError } = await supabase.from("gym_post_categories").delete().eq("post_id", id);
  if (deleteCategoriesError) {
    console.error("Failed to replace gym post categories", deleteCategoriesError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  if (categories.length) {
    const { error: categoryError } = await supabase.from("gym_post_categories").insert(
      categories.map((category) => ({
        post_id: id,
        category,
      })),
    );

    if (categoryError) {
      console.error("Failed to update gym post categories", categoryError);
      return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
    }
  }

  revalidatePostPaths(existingPost.slug);

  return NextResponse.json({ slug: existingPost.slug });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: loginRequiredMessage }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const { id } = await params;
  const existingPost = await findOwnedPost(id, user.id);
  if (!existingPost) {
    return NextResponse.json({ error: notFoundMessage }, { status: 404 });
  }

  const deleteSteps = [
    supabase.from("post_likes").delete().eq("post_id", id),
    supabase.from("gym_post_categories").delete().eq("post_id", id),
    supabase.from("gym_post_images").delete().eq("post_id", id),
  ];

  for (const step of deleteSteps) {
    const { error } = await step;
    if (error) {
      console.error("Failed to delete gym post dependencies", error);
      return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
    }
  }

  const { error: postError } = await supabase.from("gym_posts").delete().eq("id", id).eq("user_id", user.id);
  if (postError) {
    console.error("Failed to delete gym post", postError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  revalidatePostPaths(existingPost.slug);

  return NextResponse.json({ ok: true });
}

async function findOwnedPost(id: string, userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("gym_posts")
    .select("id, slug")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load owned gym post", error);
    return null;
  }

  return data;
}

function parseJsonStringArray(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseUploadedImages(value: FormDataEntryValue | null): UploadedPostImage[] {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        publicUrl: typeof item?.publicUrl === "string" ? item.publicUrl.trim() : "",
      }))
      .filter((item) => item.publicUrl.startsWith("https://"));
  } catch {
    return [];
  }
}

function moveItemToFront<T>(items: T[], index: number) {
  if (index <= 0 || index >= items.length) return items;
  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
}

function revalidatePostPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/sitemap.xml");
}
