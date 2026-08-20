import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getRankingCategories } from "@/lib/product-rankings";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GymScale, ProductCategory } from "@/lib/types";

export const runtime = "nodejs";

const gymScales = new Set<GymScale>(["compact", "standard", "serious"]);
const productCategories = new Set<ProductCategory>(getRankingCategories());
const invalidInputMessage = "入力内容を確認してください。";
const serverErrorMessage = "サーバー設定に問題があります。時間をおいて再度お試しください。";
const defaultAuthorName = "匿名";
const maxAuthorNameLength = 40;
const maxSnsUrlLength = 300;
const maxAvatarBytes = 2_000_000;

type UploadedPostImage = {
  publicUrl: string;
};

export async function POST(request: Request) {
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
  const uploadedImages = parseUploadedImages(formData.get("uploadedImages"));
  const categories = parseJsonStringArray(formData.get("categories")).filter((category): category is ProductCategory =>
    productCategories.has(category as ProductCategory),
  );
  const thumbnailIndex = Math.max(0, Number(formData.get("thumbnailIndex") ?? 0));
  const imageFiles = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0 && file.type.startsWith("image/"));
  const authorName = String(formData.get("authorName") ?? "").trim().slice(0, maxAuthorNameLength) || defaultAuthorName;
  const instagramUrl = normalizeSnsUrl(formData.get("instagramUrl"));
  const tiktokUrl = normalizeSnsUrl(formData.get("tiktokUrl"));
  const xUrl = normalizeSnsUrl(formData.get("xUrl"));
  const avatarFile = formData.get("avatarFile");

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

  if (!uploadedImages.length && !imageFiles.length) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  const hasAvatar = avatarFile instanceof File && avatarFile.size > 0 && avatarFile.type.startsWith("image/");
  if (hasAvatar && avatarFile.size > maxAvatarBytes) {
    return NextResponse.json({ error: "アイコン画像の容量が大きすぎます。" }, { status: 413 });
  }

  const slug = `${slugify(title)}-${Date.now()}`;
  const { data: post, error: postError } = await supabase
    .from("gym_posts")
    .insert({
      title,
      slug,
      scale,
      area_tatami: areaTatami,
      budget,
      summary: description,
      tags,
      author_name: authorName,
      instagram_url: instagramUrl,
      tiktok_url: tiktokUrl,
      x_url: xUrl,
      published: true,
    })
    .select("id")
    .single();

  if (postError || !post) {
    console.error("Failed to create gym post", postError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  if (hasAvatar) {
    const extension = getImageExtension(avatarFile);
    const storagePath = `posts/${post.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(storagePath, avatarFile, {
      contentType: avatarFile.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Failed to upload post author avatar", uploadError);
      return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from("profile-avatars").getPublicUrl(storagePath);
    const { error: avatarUpdateError } = await supabase
      .from("gym_posts")
      .update({ author_avatar_url: publicUrl.publicUrl })
      .eq("id", post.id);

    if (avatarUpdateError) {
      console.error("Failed to save post author avatar", avatarUpdateError);
      return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
    }
  }

  const imageRows = [];

  if (uploadedImages.length) {
    const orderedImages = moveItemToFront(uploadedImages, thumbnailIndex);
    imageRows.push(
      ...orderedImages.map((image, index) => ({
        post_id: post.id,
        storage_path: image.publicUrl,
        alt: `${title} ${index + 1}`,
        sort_order: index,
      })),
    );
  } else {
    const orderedFiles = moveItemToFront(imageFiles, thumbnailIndex);
    for (const [index, file] of orderedFiles.entries()) {
      const extension = getImageExtension(file);
      const storagePath = `posts/${post.id}/${index}.${extension}`;
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

  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/sitemap.xml");

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

function normalizeSnsUrl(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim().slice(0, maxSnsUrlLength) : "";
  if (!text) return null;

  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  } catch {
    return null;
  }

  return text;
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

function getImageExtension(file: File) {
  const fromType = file.type.split("/")[1]?.replace("jpeg", "jpg");
  if (fromType) return fromType;

  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName || "jpg";
}
