import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth-user";
import { getRankingCategories } from "@/lib/product-rankings";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GymScale, ProductCategory } from "@/lib/types";

export const runtime = "nodejs";

const gymScales = new Set<GymScale>(["compact", "standard", "serious"]);
const productCategories = new Set<ProductCategory>(getRankingCategories());
const loginRequiredMessage = "投稿にはログインが必要です。";
const invalidInputMessage = "入力内容を確認してください。";
const serverErrorMessage = "サーバー設定に問題があります。時間をおいて再度お試しください。";

export async function POST(request: Request) {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: loginRequiredMessage }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const areaTatami = Number(formData.get("areaTatami") ?? 0);
  const budget = Number(formData.get("budget") ?? 0);
  const scaleValue = String(formData.get("scale") ?? "compact");
  const scale: GymScale = gymScales.has(scaleValue as GymScale) ? (scaleValue as GymScale) : "compact";
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseJsonStringArray(formData.get("tags"));
  const categories = parseJsonStringArray(formData.get("categories")).filter((category): category is ProductCategory =>
    productCategories.has(category as ProductCategory),
  );
  const thumbnailIndex = Math.max(0, Number(formData.get("thumbnailIndex") ?? 0));
  const imageFiles = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0 && file.type.startsWith("image/"));

  if (!title) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  if (!Number.isFinite(areaTatami) || areaTatami <= 0) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  if (!Number.isFinite(budget) || budget < 0) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  if (!imageFiles.length) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  const existingProfile = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!existingProfile.data) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      display_name: user.name,
      avatar_url: user.avatarUrl,
    });

    if (profileError) {
      console.error("Failed to create Auth0 profile", profileError);
      return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
    }
  }

  const slug = `${slugify(title)}-${Date.now()}`;
  const { data: post, error: postError } = await supabase
    .from("gym_posts")
    .insert({
      user_id: user.id,
      title,
      slug,
      scale,
      area_tatami: areaTatami,
      budget,
      summary: description,
      tags,
      published: true,
    })
    .select("id")
    .single();

  if (postError || !post) {
    console.error("Failed to create gym post", postError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const orderedFiles = moveItemToFront(imageFiles, thumbnailIndex);
  const imageRows = [];
  for (const [index, file] of orderedFiles.entries()) {
    const extension = getImageExtension(file);
    const storagePath = `${safeStorageKey(user.id)}/${post.id}/${index}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("gym-post-images").upload(storagePath, file, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Failed to upload gym post image", uploadError);
      return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from("gym-post-images").getPublicUrl(storagePath);
    imageRows.push({
      post_id: post.id,
      storage_path: publicUrl.publicUrl,
      alt: `${title} ${index + 1}`,
      sort_order: index,
    });
  }

  const { error: imageError } = await supabase.from("gym_post_images").insert(imageRows);
  if (imageError) {
    console.error("Failed to create gym post image rows", imageError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  if (categories.length) {
    const { error: categoryError } = await supabase.from("gym_post_categories").insert(
      categories.map((category) => ({
        post_id: post.id,
        category,
      })),
    );

    if (categoryError) {
      console.error("Failed to create gym post categories", categoryError);
      return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
    }
  }

  return NextResponse.json({ slug });
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

function moveItemToFront<T>(items: T[], index: number) {
  if (index <= 0 || index >= items.length) return items;
  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
}

function slugify(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "post";
}

function safeStorageKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "user";
}

function getImageExtension(file: File) {
  const fromType = file.type.split("/")[1]?.replace("jpeg", "jpg");
  if (fromType) return fromType;

  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName || "jpg";
}
