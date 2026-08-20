import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const maxImageBytes = 4_000_000;

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "サーバー設定に問題があります。時間をおいて再度お試しください。" }, { status: 500 });
  }

  const formData = await request.formData();
  const imageFile = formData.get("image");

  if (!(imageFile instanceof File) || imageFile.size <= 0 || !imageFile.type.startsWith("image/")) {
    return NextResponse.json({ error: "画像を選択してください。" }, { status: 400 });
  }

  if (imageFile.size > maxImageBytes) {
    return NextResponse.json({ error: "画像の容量が大きすぎます。" }, { status: 413 });
  }

  const extension = getImageExtension(imageFile);
  const storagePath = `pending/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("gym-post-images").upload(storagePath, imageFile, {
    contentType: imageFile.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("Failed to upload pending gym post image", uploadError);
    return NextResponse.json({ error: "画像のアップロードに失敗しました。" }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from("gym-post-images").getPublicUrl(storagePath);

  return NextResponse.json({
    publicUrl: publicUrl.publicUrl,
    storagePath,
  });
}

function getImageExtension(file: File) {
  const fromType = file.type.split("/")[1]?.replace("jpeg", "jpg");
  if (fromType) return fromType;

  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName || "jpg";
}
