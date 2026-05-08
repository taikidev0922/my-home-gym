import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Tag } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getBlogArticleBySlug } from "@/lib/blog-repository";
import { absoluteUrl, baseSeoKeywords, siteName } from "@/lib/seo";

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export async function generateMetadata({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);

  if (!article) {
    return {
      title: `記事が見つかりません | ${siteName}`,
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    keywords: [...baseSeoKeywords, article.keyword, article.category, "ホームジム お助け記事"],
    alternates: {
      canonical: absoluteUrl(`/blog/${article.slug}`),
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: absoluteUrl(`/blog/${article.slug}`),
      siteName,
      locale: "ja_JP",
      type: "article",
      images: [article.imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);

  if (!article) notFound();

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#122018]">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-0 py-5 sm:px-6 sm:py-6">
        <article className="overflow-hidden sm:rounded-lg sm:border sm:border-[#ded6ca] sm:bg-white sm:shadow-sm">
          <div className="px-4 pb-8 pt-2 sm:p-8">
            <div className="flex flex-wrap gap-2 text-xs font-bold text-[#69756d]">
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f3efe7] px-2 py-1">
                <Tag size={14} />
                {article.keyword}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f3efe7] px-2 py-1">
                <CalendarDays size={14} />
                {dateFormatter.format(new Date(article.publishedAt))}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f3efe7] px-2 py-1">
                <Clock size={14} />
                {article.readingMinutes}分
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 text-lg leading-9 text-[#4e5b52]">{article.excerpt}</p>

            <div className="mt-8 grid gap-8">
              {article.blocks.map((block) => (
                <section key={block.heading}>
                  <h2 className="border-l-4 border-[#e4572e] pl-3 text-2xl font-bold leading-tight">
                    {block.heading}
                  </h2>
                  <div className="mt-4 grid gap-4 text-base leading-8 text-[#4e5b52]">
                    {block.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {block.visual?.imageUrl ? (
                    <div className="-mx-4 mt-5 overflow-hidden sm:mx-0 sm:rounded-lg">
                      <Image
                        src={block.visual.imageUrl}
                        alt={block.visual.alt || block.visual.title}
                        width={1536}
                        height={1024}
                        className="h-auto w-full"
                        sizes="(max-width: 896px) 100vw, 896px"
                      />
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
