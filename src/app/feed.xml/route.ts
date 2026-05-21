import { getBlogArticles } from "@/lib/blog-repository";
import { absoluteUrl, defaultSeoDescription, siteName, siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export async function GET() {
  const articles = await getBlogArticles();
  const updatedAt = articles[0]?.updatedAt ?? new Date().toISOString();
  const items = articles
    .slice(0, 50)
    .map((article) => {
      const url = absoluteUrl(`/blog/${article.slug}`);
      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <description>${escapeXml(article.excerpt)}</description>
          <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
          <category>${escapeXml(article.keyword)}</category>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${siteName} ブログ`)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(defaultSeoDescription)}</description>
    <language>ja-JP</language>
    <lastBuildDate>${new Date(updatedAt).toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
