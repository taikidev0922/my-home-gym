import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateHomeGymArticle } from "@/lib/blog-generator";
import { markKeywordUsed, selectHomeGymKeyword } from "@/lib/blog-keywords";
import { appendBlogArticle, getBlogArticles } from "@/lib/blog-repository";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  return publishBlogArticle(request);
}

export async function POST(request: NextRequest) {
  return publishBlogArticle(request);
}

async function publishBlogArticle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingArticles = await getBlogArticles();
    const keyword = await selectHomeGymKeyword(existingArticles);
    const article = await generateHomeGymArticle(keyword);
    const result = await appendBlogArticle(article);

    await markKeywordUsed(keyword, {
      slug: article.slug,
      title: article.title,
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${article.slug}`);

    return NextResponse.json({
      ok: true,
      skipped: result.skipped,
      slug: article.slug,
      title: article.title,
      keyword: keyword.keyword,
      articleSource: article.articleSource,
      keywordSource: keyword.source,
    });
  } catch (error) {
    console.error("Failed to publish blog article", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!expectedSecret) return process.env.NODE_ENV !== "production" || isVercelCron;

  return authHeader === `Bearer ${expectedSecret}` || querySecret === expectedSecret || isVercelCron;
}
