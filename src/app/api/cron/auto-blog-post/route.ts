import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const githubDispatchUrl =
  "https://api.github.com/repos/taikidev0922/my-home-gym/actions/workflows/auto-blog-post.yml/dispatches";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.GITHUB_ACTIONS_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_ACTIONS_DISPATCH_TOKEN is not configured" }, { status: 500 });
  }

  const response = await fetch(githubDispatchUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main" }),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    console.error("[blog-cron] failed to dispatch GitHub workflow", response.status, message.slice(0, 300));

    return NextResponse.json(
      {
        error: "Failed to dispatch GitHub workflow",
        status: response.status,
      },
      { status: 502 },
    );
  }

  console.info("[blog-cron] dispatched GitHub workflow", { workflow: "auto-blog-post.yml", ref: "main" });
  return NextResponse.json({ ok: true, dispatched: true });
}
