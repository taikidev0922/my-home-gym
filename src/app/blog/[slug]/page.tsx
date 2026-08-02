import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { AffiliateDisclosure } from "@/components/affiliate-disclosure";
import { SiteHeader } from "@/components/site-header";
import { getBlogArticleBySlug, getBlogArticles, getBlogArticlesPage } from "@/lib/blog-repository";
import { createBlogArticleJsonLd, createBlogBreadcrumbJsonLd, createBlogFaqJsonLd, createBlogFaqs } from "@/lib/blog-seo";
import { absoluteUrl, baseSeoKeywords, siteAuthorName, siteName } from "@/lib/seo";
import type { AffiliateProduct } from "@/lib/affiliate-products";
import { getAffiliateProductsByIds } from "@/lib/affiliate-products-server";
import { affiliateOfferKindLabels, type AffiliateOffer } from "@/lib/affiliate-offers";
import { getAffiliateOffersByIds } from "@/lib/affiliate-offers-server";
import { productCategoryLabels } from "@/lib/product-rankings";
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

function getAffiliateOfferMarkerId(text: string) {
  const match = text.trim().match(/^\{\{offer:([a-z0-9-]+)\}\}$/);
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
  const categoryLabel = productCategoryLabels[product.category];

  return (
    <div className="grid gap-2">
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
      <Link
        href={`/rankings?category=${product.category}`}
        className="pressable-card group flex min-w-0 items-center justify-between gap-3 rounded-lg border-2 border-[#e4572e] bg-[#fff8f4] px-4 py-3 text-[#122018] shadow-sm transition hover:bg-[#e4572e] hover:text-white"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-black uppercase tracking-normal text-[#e4572e] group-hover:text-white/85">
            比較して選ぶ
          </span>
          <span className="mt-0.5 block truncate text-sm font-black">{categoryLabel}ランキングを見る</span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e4572e] text-white transition group-hover:bg-white group-hover:text-[#e4572e]">
          <ArrowRight size={17} />
        </span>
      </Link>
    </div>
  );
}

function AffiliateOfferCard({ offer }: { offer: AffiliateOffer }) {
  return (
    <aside className="grid gap-3 rounded-lg border-2 border-[#cfd8cf] bg-[#f8faf7] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-[#122018] px-2.5 py-1 text-[11px] font-black leading-none text-white">
          {affiliateOfferKindLabels[offer.kind]}
        </span>
        <span className="text-[11px] font-bold text-[#69756d]">PR / {offer.provider}</span>
      </div>

      <p className="text-base font-black leading-snug text-[#122018] sm:text-lg">{offer.headline}</p>
      <p className="text-sm leading-7 text-[#4e5b52]">{offer.description}</p>

      {offer.points.length ? (
        <ul className="grid gap-1.5">
          {offer.points.map((point) => (
            <li key={point} className="flex gap-2 text-sm leading-6 text-[#4e5b52]">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e4572e]" />
              <span className="min-w-0">{point}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <a
        href={offer.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="pressable-card group flex items-center justify-between gap-3 rounded-lg bg-[#e4572e] px-4 py-3 text-white transition hover:bg-[#cf4925]"
      >
        <span className="min-w-0 text-sm font-black">
          {offer.serviceName}で{offer.actionLabel}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 text-white">
          <ArrowRight size={17} />
        </span>
      </a>

      {offer.note ? <p className="text-xs leading-6 text-[#69756d]">{offer.note}</p> : null}
    </aside>
  );
}

function getArticleInternalLinks(article: BlogArticle) {
  const categoryToRanking = {
    rack: "power-rack",
    dumbbell: "adjustable-dumbbell",
    bench: "bench",
    floor: "floor-mat",
    compact: "compact-gym",
    guide: null,
  } as const;
  const rankingCategory = categoryToRanking[article.category as keyof typeof categoryToRanking] ?? null;

  return [
    {
      href: `/blog?category=${article.category}`,
      label: "同じカテゴリの記事を見る",
    },
    rankingCategory
      ? {
          href: `/rankings?category=${rankingCategory}`,
          label: `${productCategoryLabels[rankingCategory]}ランキングを見る`,
        }
      : {
          href: "/rankings",
          label: "ホームジム用品ランキングを見る",
        },
    {
      href: "/",
      label: "ホームジム実例を見る",
    },
  ];
}

export async function generateStaticParams() {
  const articles = await getBlogArticles();
  return articles.map((article) => ({ slug: article.slug }));
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
      images: article.imageUrl
        ? [
            {
              url: absoluteUrl(article.imageUrl),
              width: 1200,
              height: 675,
              alt: article.title,
            },
          ]
        : undefined,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [siteAuthorName],
      tags: [article.keyword, ...article.tags],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: article.imageUrl ? [absoluteUrl(article.imageUrl)] : undefined,
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
  );
  const affiliateProductsById = getAffiliateProductsByIds(affiliateMarkerIds);
  const offerMarkerIds = Array.from(
    new Set(
      article.blocks.flatMap((block) =>
        block.paragraphs.map((paragraph) => getAffiliateOfferMarkerId(paragraph)).filter((id): id is string => Boolean(id)),
      ),
    ),
  );
  const affiliateOffersById = getAffiliateOffersByIds(offerMarkerIds);
  const firstVisual = article.blocks.find((block) => block.visual?.imageUrl)?.visual;
  const firstVisualImageUrl = firstVisual?.imageUrl;
  const faqs = createBlogFaqs(article);
  const jsonLd = [createBlogBreadcrumbJsonLd(article), createBlogArticleJsonLd(article), createBlogFaqJsonLd(faqs)];
  const sectionLinks = article.blocks.map((block, index) => ({
    id: `section-${index + 1}`,
    heading: block.heading,
  }));
  const internalLinks = getArticleInternalLinks(article);

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader showMobilePostButton={false} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-4xl px-0 py-5 sm:px-6 sm:py-6">
        <nav className="mb-3 px-4 text-xs font-bold text-[#69756d] sm:px-0" aria-label="パンくずリスト">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#e4572e]">
                ホーム
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="hover:text-[#e4572e]">
                ブログ
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="line-clamp-1 text-[#122018]">
              {article.title}
            </li>
          </ol>
        </nav>
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

            <nav className="mt-6 border-y border-[#d8e0d6] py-4" aria-label="記事の目次">
              <h2 className="text-sm font-bold text-[#69756d]">目次</h2>
              <ol className="mt-2 divide-y divide-[#d8e0d6] text-sm font-bold">
                {sectionLinks.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex min-w-0 items-start gap-3 py-2.5 text-[#122018] transition hover:text-[#e4572e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4572e]"
                    >
                      <span className="w-5 shrink-0 pt-0.5 text-xs font-black text-[#e4572e]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 leading-6">
                        {section.heading}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <aside className="mt-4 rounded-lg border border-[#cfd8cf] bg-white p-4" aria-label="関連リンク">
              <h2 className="text-base font-bold">関連リンク</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {internalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2 text-sm font-bold text-[#4e5b52] hover:border-[#e4572e]/60 hover:text-[#e4572e]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </aside>

            <div className="mt-8 grid gap-8">
              {article.blocks.map((block, index) => (
                <section key={block.heading} id={`section-${index + 1}`} className="scroll-mt-20">
                  <h2 className="border-l-4 border-[#e4572e] pl-3 text-2xl font-bold leading-tight">
                    {block.heading}
                  </h2>
                  <div className="mt-4 grid gap-4 text-base leading-8 text-[#4e5b52]">
                    {block.paragraphs.map((paragraph) => {
                      const affiliateMarkerId = getAffiliateProductMarkerId(paragraph);

                      if (affiliateMarkerId) {
                        const affiliateProduct = affiliateProductsById.get(affiliateMarkerId);
                        return affiliateProduct ? <AffiliateProductCard key={paragraph} product={affiliateProduct} /> : null;
                      }

                      const offerMarkerId = getAffiliateOfferMarkerId(paragraph);

                      if (offerMarkerId) {
                        const offer = affiliateOffersById.get(offerMarkerId);
                        return offer ? <AffiliateOfferCard key={paragraph} offer={offer} /> : null;
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
              <section>
                <h2 className="text-xl font-bold">よくある質問</h2>
                <div className="mt-3 divide-y divide-[#d8e0d6] border-y border-[#d8e0d6]">
                  {faqs.map((faq) => (
                    <details key={faq.question} className="group py-3">
                      <summary className="cursor-pointer list-none text-base font-bold leading-7 text-[#122018] marker:hidden">
                        <span className="inline text-[#e4572e]">Q. </span>
                        {faq.question}
                      </summary>
                      <p className="mt-2 text-sm leading-7 text-[#4e5b52]">
                        <span className="font-bold text-[#69756d]">A. </span>
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>

              <RelatedArticles article={article} />

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

              <AffiliateDisclosure className="mt-6" />
            </footer>
          </div>
        </article>
      </div>
    </main>
  );
}

async function RelatedArticles({ article }: { article: BlogArticle }) {
  const relatedPage = await getBlogArticlesPage({ category: article.category, page: 1, pageSize: 4 });
  const relatedArticles = relatedPage.articles.filter((related) => related.slug !== article.slug).slice(0, 3);

  if (!relatedArticles.length) return null;

  return (
    <section className="mt-6">
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
