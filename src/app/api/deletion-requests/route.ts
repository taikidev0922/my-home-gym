import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const invalidInputMessage = "入力内容を確認してください。";
const serverErrorMessage = "サーバー設定に問題があります。時間をおいて再度お試しください。";
const maxReasonLength = 1000;
const maxContactLength = 200;

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as {
    postId?: unknown;
    reason?: unknown;
    contact?: unknown;
  } | null;

  const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, maxReasonLength) : "";
  const contact = typeof body?.contact === "string" ? body.contact.trim().slice(0, maxContactLength) : "";

  if (!postId || !reason) {
    return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
  }

  const { data: post, error: postError } = await supabase
    .from("gym_posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    console.error("Failed to load gym post for deletion request", postError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  if (!post) {
    return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
  }

  const { error: insertError } = await supabase.from("post_deletion_requests").insert({
    post_id: postId,
    reason,
    contact: contact || null,
  });

  if (insertError) {
    console.error("Failed to create post deletion request", insertError);
    return NextResponse.json({ error: serverErrorMessage }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
