import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { getBlogArticleBySlug, getBlogArticlesPage } from "@/lib/blog-repository";
import { absoluteUrl, baseSeoKeywords, siteName } from "@/lib/seo";
import { getAffiliateProductById, type AffiliateProduct } from "@/lib/affiliate-products";

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function renderInlineLinks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(linkPattern)) {
    const index = match.index ?? 0;
    const [fullText, label, href] = match;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    nodes.push(
      <a
        key={`${href}-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="font-bold text-[#e4572e] underline underline-offset-4"
      >
        {label}
      </a>,
    );

    lastIndex = index + fullText.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

function getAffiliateProductMarker(text: string) {
  const match = text.trim().match(/^\{\{affiliate:([a-z0-9-]+)\}\}$/);
  if (!match) return null;

  return getAffiliateProductById(match[1]) ?? null;
}

function AffiliateProductCard({ product }: { product: AffiliateProduct }) {
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="pressable-card group grid overflow-hidden rounded-lg border border-[#cfd8cf] bg-[#ffffff] shadow-sm transition hover:border-[#e4572e]/60 sm:grid-cols-[180px_1fr]"
    >
      <div className="flex min-h-40 items-center justify-center border-b border-[#cfd8cf] bg-white p-4 sm:border-b-0 sm:border-r">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={360}
          height={260}
          className="max-h-36 w-full object-contain"
          sizes="(max-width: 640px) 100vw, 180px"
        />
      </div>
      <div className="p-4">
        <p className="text-xs font-bold text-[#e4572e]">{product.genre}</p>
        <p className="mt-1 text-lg font-bold leading-snug text-[#122018]">{product.name}</p>
        <p className="mt-2 text-sm text-[#69756d]">{product.maker}</p>
        <span className="mt-4 inline-flex rounded-lg bg-[#e4572e] px-3 py-2 text-sm font-bold text-white transition group-hover:bg-[#cf4925]">
          商品を見る
        </span>
      </div>
    </a>
  );
}

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

  const relatedPage = await getBlogArticlesPage({ category: article.category, page: 1, pageSize: 4 });
  const relatedArticles = relatedPage.articles.filter((related) => related.slug !== article.slug).slice(0, 3);
  const firstVisual = article.blocks.find((block) => block.visual?.imageUrl)?.visual;
  const firstVisualImageUrl = firstVisual?.imageUrl;

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-0 py-5 sm:px-6 sm:py-6">
        <article className="overflow-hidden sm:rounded-lg sm:border sm:border-[#cfd8cf] sm:bg-white sm:shadow-sm">
          <div className="px-4 pb-8 pt-2 sm:p-8">
            <div className="flex flex-wrap gap-2 text-xs font-bold text-[#69756d]">
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f7f8f5] px-2 py-1">
                <Tag size={14} />
                {article.keyword}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f7f8f5] px-2 py-1">
                <CalendarDays size={14} />
                {dateFormatter.format(new Date(article.publishedAt))}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#f7f8f5] px-2 py-1">
                <Clock size={14} />
                {article.readingMinutes}分
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 text-lg leading-9 text-[#4e5b52]">{article.excerpt}</p>

            {firstVisualImageUrl ? (
              <div className="-mx-4 mt-6 overflow-hidden sm:mx-0 sm:rounded-lg">
                <Image
                  src={firstVisualImageUrl}
                  alt={firstVisual.alt || firstVisual.title}
                  width={1536}
                  height={1024}
                  className="h-auto w-full"
                  priority
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
            ) : null}

            <div className="mt-8 grid gap-8">
              {article.blocks.map((block) => (
                <section key={block.heading}>
                  <h2 className="border-l-4 border-[#e4572e] pl-3 text-2xl font-bold leading-tight">
                    {block.heading}
                  </h2>
                  <div className="mt-4 grid gap-4 text-base leading-8 text-[#4e5b52]">
                    {block.paragraphs.map((paragraph) => {
                      const product = getAffiliateProductMarker(paragraph);

                      if (product) {
                        return <AffiliateProductCard key={paragraph} product={product} />;
                      }

                      return <p key={paragraph}>{renderInlineLinks(paragraph)}</p>;
                    })}
                  </div>
                  {block.visual?.imageUrl && block.visual.imageUrl !== firstVisualImageUrl ? (
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

            <footer className="mt-10 border-t border-[#cfd8cf] pt-6">
              {relatedArticles.length > 0 ? (
                <section>
                  <h2 className="text-xl font-bold">関連記事</h2>
                  <div className="mt-3 grid gap-2">
                    {relatedArticles.map((related) => (
                      <Link
                        key={related.slug}
                        href={`/blog/${related.slug}`}
                        className="pressable-card group flex items-center justify-between gap-3 rounded-lg border border-[#cfd8cf] bg-white px-3 py-3 text-sm font-bold shadow-sm hover:border-[#e4572e]/60"
                      >
                        <span className="line-clamp-2">{related.title}</span>
                        <ArrowRight
                          size={16}
                          className="shrink-0 text-[#e4572e] transition group-hover:translate-x-0.5"
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={relatedArticles.length > 0 ? "mt-6" : ""}>
                <h2 className="text-xl font-bold">次に見る</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/"
                    className="pressable-card rounded-lg border border-[#cfd8cf] bg-white p-4 shadow-sm hover:border-[#e4572e]/60"
                  >
                    <p className="text-sm font-bold text-[#e4572e]">投稿を見る</p>
                    <p className="mt-1 text-lg font-bold">みんなでホームジムを共有する</p>
                    <p className="mt-2 text-sm leading-6 text-[#4e5b52]">
                      広さ、費用、器具カテゴリから実例を探せます。
                    </p>
                  </Link>
                  <Link
                    href="/rankings"
                    className="pressable-card rounded-lg border border-[#cfd8cf] bg-white p-4 shadow-sm hover:border-[#e4572e]/60"
                  >
                    <p className="text-sm font-bold text-[#e4572e]">器具選び</p>
                    <p className="mt-1 text-lg font-bold">ホームジム用品ランキング</p>
                    <p className="mt-2 text-sm leading-6 text-[#4e5b52]">
                      ラック、ダンベル、ベンチなどの候補を比較できます。
                    </p>
                  </Link>
                </div>
              </section>
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}
