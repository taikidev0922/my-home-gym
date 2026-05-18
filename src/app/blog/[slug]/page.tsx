import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Tag } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { SiteHeader } from "@/components/site-header";
import { getBlogArticleBySlug, getBlogArticlesPage } from "@/lib/blog-repository";
import { absoluteUrl, baseSeoKeywords, siteName } from "@/lib/seo";
import type { AffiliateProduct } from "@/lib/affiliate-products";
import { getAffiliateProductById } from "@/lib/affiliate-products-server";
import type { BlogArticle } from "@/lib/types";

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

function getAffiliateProductMarkerId(text: string) {
  const match = text.trim().match(/^\{\{affiliate:([a-z0-9-]+)\}\}$/);
  if (!match) return null;

  return match[1];
}

function parseRatingValue(value: string) {
  const match = value.match(/([0-5](?:\.\d+)?)/);
  if (!match) return null;

  const rating = Number(match[1]);
  return Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : null;
}

function StarRating({ value }: { value: string }) {
  const rating = parseRatingValue(value);
  const filledStars = rating == null ? 0 : Math.round(rating);

  return (
    <span className="inline-flex min-w-0 items-center gap-1" title={value}>
      <span className="whitespace-nowrap text-[13px] leading-none text-[#e0a11b]" aria-hidden="true">
        {"★★★★★".split("").map((star, index) => (
          <span key={index} className={index < filledStars ? "text-[#e0a11b]" : "text-[#d6ded4]"}>
            {star}
          </span>
        ))}
      </span>
      {rating != null ? <span className="font-black text-[#122018]">{rating.toFixed(1)}</span> : null}
    </span>
  );
}

function AffiliateProductCard({ product }: { product: AffiliateProduct }) {
  const details = [
    product.dimensionsText ? { label: "サイズ", value: product.dimensionsText } : null,
    product.weightText ? { label: "重量", value: product.weightText } : null,
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail));
  const feature = product.featureBullets.find((item) => item.trim().length > 0);

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="pressable-card group grid min-w-0 overflow-hidden rounded-lg border border-[#cfd8cf] bg-white shadow-sm transition hover:border-[#e4572e]/60 sm:grid-cols-[150px_minmax(0,1fr)]"
    >
      <div className="flex min-h-32 items-center justify-center border-b border-[#cfd8cf] bg-white p-3 sm:border-b-0 sm:border-r">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={320}
            height={240}
            className="max-h-28 w-full object-contain"
            sizes="(max-width: 640px) 100vw, 150px"
          />
        ) : (
          <span className="text-xs font-bold text-[#69756d]">No image</span>
        )}
      </div>
      <div className="min-w-0 p-4">
        <p className="text-xs font-bold text-[#e4572e]">{product.genre}</p>
        <p className="mt-1 truncate text-base font-bold leading-snug text-[#122018]" title={product.name}>
          {product.name}
        </p>
        <p className="mt-1 truncate text-sm text-[#69756d]" title={product.brand || product.maker}>
          {product.brand || product.maker}
        </p>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          {product.priceText ? (
            <span className="rounded-md bg-[#122018] px-2.5 py-1 text-sm font-black leading-none text-white">
              {product.priceText}
            </span>
          ) : null}
          {product.ratingText ? (
            <span className="inline-flex min-w-0 items-center rounded-md bg-[#fff7e6] px-2.5 py-1 text-xs font-bold text-[#7b5a13]">
              <StarRating value={product.ratingText} />
            </span>
          ) : null}
        </div>
        {details.length ? (
          <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0 overflow-hidden rounded-md bg-[#f4f7f2] px-2 py-1">
                <dt className="font-bold text-[#69756d]">{detail.label}</dt>
                <dd className="truncate font-bold text-[#122018]" title={detail.value}>
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {feature ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4e5a50]">{feature}</p> : null}
        <span className="mt-4 inline-flex rounded-lg bg-[#e4572e] px-3 py-2 text-sm font-bold text-white transition group-hover:bg-[#cf4925]">
          商品を見る
        </span>
      </div>
    </a>
  );
}

function AffiliateProductCardSkeleton() {
  return (
    <div
      className="grid min-w-0 overflow-hidden rounded-lg border border-[#cfd8cf] bg-white shadow-sm sm:grid-cols-[150px_minmax(0,1fr)]"
      aria-busy="true"
    >
      <div className="min-h-32 border-b border-[#cfd8cf] bg-[#f4f7f2] sm:border-b-0 sm:border-r" />
      <div className="min-w-0 p-4">
        <div className="h-4 w-28 rounded bg-[#e4ebe1]" />
        <div className="mt-3 h-5 w-4/5 rounded bg-[#e4ebe1]" />
        <div className="mt-2 h-4 w-36 rounded bg-[#e4ebe1]" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-11 rounded-md bg-[#f4f7f2]" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function AffiliateProductSlot({ id }: { id: string }) {
  const product = await getAffiliateProductById(id);
  if (!product) return null;

  return <AffiliateProductCard product={product} />;
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

export default function BlogArticlePage(props: BlogArticlePageProps) {
  return <BlogArticleContent {...props} />;
}

async function BlogArticleContent({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getBlogArticleBySlug(slug);

  if (!article) notFound();

  const affiliateMarkerIds = Array.from(
    new Set(
      article.blocks.flatMap((block) =>
        block.paragraphs.map((paragraph) => getAffiliateProductMarkerId(paragraph)).filter((id): id is string => Boolean(id)),
      ),
    ),
  ).slice(0, 1);
  const firstAffiliateMarkerId = affiliateMarkerIds[0] ?? null;
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
            <AffiliateDisclosure className="mt-5" />

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
                      const affiliateMarkerId = getAffiliateProductMarkerId(paragraph);
                      if (affiliateMarkerId && affiliateMarkerId !== firstAffiliateMarkerId) return null;

                      if (affiliateMarkerId) {
                        return (
                          <Suspense key={paragraph} fallback={<AffiliateProductCardSkeleton />}>
                            <AffiliateProductSlot id={affiliateMarkerId} />
                          </Suspense>
                        );
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
              <Suspense fallback={<RelatedArticlesSkeleton />}>
                <RelatedArticles article={article} />
              </Suspense>

              <section className="mt-6">
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

function RelatedArticlesSkeleton() {
  return (
    <section aria-busy="true">
      <h2 className="text-xl font-bold">関連記事</h2>
      <div className="mt-3 grid gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-12 rounded-lg border border-[#cfd8cf] bg-white shadow-sm">
            <div className="m-3 h-5 w-3/4 rounded bg-[#e4ebe1]" />
          </div>
        ))}
      </div>
    </section>
  );
}

async function RelatedArticles({ article }: { article: BlogArticle }) {
  const relatedPage = await getBlogArticlesPage({ category: article.category, page: 1, pageSize: 4 });
  const relatedArticles = relatedPage.articles.filter((related) => related.slug !== article.slug).slice(0, 3);

  if (!relatedArticles.length) return null;

  return (
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
  );
}
