import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/lib/auth-user";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: "プロフィールの保存にはログインが必要です。" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "サーバー設定に問題があります。" }, { status: 500 });
  }

  const formData = await request.formData();
  const displayName = String(formData.get("displayName") ?? "").trim() || user.name;
  const instagramUrl = normalizeUrl(formData.get("instagramUrl"));
  const tiktokUrl = normalizeUrl(formData.get("tiktokUrl"));
  const xUrl = normalizeUrl(formData.get("xUrl"));
  const avatarFile = formData.get("avatarFile");

  let avatarUrl: string | null | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0 && avatarFile.type.startsWith("image/")) {
    const extension = getImageExtension(avatarFile);
    const storagePath = `${safeStorageKey(user.id)}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(storagePath, avatarFile, {
      contentType: avatarFile.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Failed to upload profile avatar", uploadError);
      return NextResponse.json({ error: "アイコン画像のアップロードに失敗しました。" }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from("profile-avatars").getPublicUrl(storagePath);
    avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;
  }

  const payload = {
    id: user.id,
    display_name: displayName,
    instagram_url: instagramUrl,
    tiktok_url: tiktokUrl,
    x_url: xUrl,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("avatar_url")
    .single();

  if (error) {
    console.error("Failed to save profile", error);
    return NextResponse.json({ error: "プロフィールの保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ avatarUrl: data?.avatar_url ?? avatarUrl ?? "" });
}

function normalizeUrl(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
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
