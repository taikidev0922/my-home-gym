import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Clock, Search } from "lucide-react";
import { getBlogArticles } from "@/lib/blog-repository";
import { absoluteUrl, baseSeoKeywords, siteName } from "@/lib/seo";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export const metadata: Metadata = {
  title: "ブログ",
  description: "ホームジム作りの広さ、予算、器具選び、床材、防音、畳数の考え方をまとめたブログ記事一覧。",
  keywords: [...baseSeoKeywords, "ホームジム ブログ", "ホームジム 作り方", "ホームジム 初心者"],
  alternates: {
    canonical: absoluteUrl("/blog"),
  },
  openGraph: {
    title: `ブログ | ${siteName}`,
    description: "ホームジム作りの広さ、予算、器具選び、床材、防音、畳数の考え方をまとめたブログ記事一覧。",
    url: absoluteUrl("/blog"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
};

export default async function BlogPage() {
  const articles = await getBlogArticles();
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <main className="min-h-screen bg-[#090909] text-[#f4f4f5]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#c8c8cc]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>

        <section className="mt-6 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
            ブログ
          </h1>
        </section>

        {featured ? (
          <section className="mt-6 grid overflow-hidden rounded-lg border border-white/10 bg-[#151515] shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
            <Link href={`/blog/${featured.slug}`} className="relative block min-h-80 bg-[#202020]">
              <Image
                src={featured.imageUrl}
                alt={featured.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
              />
            </Link>
            <div className="flex flex-col justify-center p-5 sm:p-7">
              <p className="text-sm font-bold text-[#e4572e]">最新記事</p>
              <Link href={`/blog/${featured.slug}`} className="mt-2 text-3xl font-bold leading-tight hover:underline">
                {featured.title}
              </Link>
              <p className="mt-4 leading-8 text-[#d4d4d8]">{featured.excerpt}</p>
              <ArticleMeta article={featured} />
              <Link
                href={`/blog/${featured.slug}`}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-[#e4572e] px-4 py-3 text-sm font-bold text-white"
              >
                記事を読む
              </Link>
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#a1a1aa]">記事一覧</p>
              <h2 className="text-2xl font-bold">ホームジムの作り方を探す</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-[#151515] px-3 py-2 text-sm font-semibold text-[#a1a1aa] sm:flex">
              <Search size={16} />
              {articles.length}件
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(featured ? rest : articles).map((article) => (
              <article key={article.slug} className="overflow-hidden rounded-lg border border-white/10 bg-[#151515] shadow-sm">
                <Link href={`/blog/${article.slug}`} className="relative block aspect-[4/3] bg-[#202020]">
                  <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </Link>
                <div className="p-4">
                  <p className="text-xs font-bold text-[#e4572e]">{article.keyword}</p>
                  <Link href={`/blog/${article.slug}`} className="mt-2 block text-xl font-bold leading-7 hover:underline">
                    {article.title}
                  </Link>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#d4d4d8]">{article.excerpt}</p>
                  <ArticleMeta article={article} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ArticleMeta({ article }: { article: Awaited<ReturnType<typeof getBlogArticles>>[number] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#a1a1aa]">
      <span className="inline-flex items-center gap-1 rounded-lg bg-[#202020] px-2 py-1">
        <CalendarDays size={14} />
        {dateFormatter.format(new Date(article.publishedAt))}
      </span>
      <span className="inline-flex items-center gap-1 rounded-lg bg-[#202020] px-2 py-1">
        <Clock size={14} />
        {article.readingMinutes}分
      </span>
    </div>
  );
}
