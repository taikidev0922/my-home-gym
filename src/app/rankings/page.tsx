import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, ExternalLink, SearchCheck, Trophy } from "lucide-react";
import { RankingCategoryFilter } from "@/components/ranking-category-filter";
import { SiteHeader } from "@/components/site-header";
import {
  getRankingProductCategories,
  productCategoryDescriptions,
  productCategoryLabels,
} from "@/lib/product-rankings";
import { getRankingProductsWithAffiliateLinks } from "@/lib/product-rankings-server";
import { getHeaderUser } from "@/lib/header-user";
import { absoluteUrl, baseSeoKeywords, categorySeoKeywords, rankingSeoKeywords, siteName } from "@/lib/seo";
import type { ProductCategory, RankingProduct } from "@/lib/types";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

type RankingsPageProps = {
  searchParams: Promise<{ category?: ProductCategory | string }>;
};

const rankingFaqs = [
  {
    question: "ホームジム用品は最初に何から揃えるべきですか？",
    answer:
      "畳数と予算に合わせて、床材・防振マット、可変式ダンベル、トレーニングベンチ、パワーラックの順で検討すると失敗しにくくなります。",
  },
  {
    question: "省スペースでもホームジムは作れますか？",
    answer:
      "1畳からでも可変式ダンベル、折りたたみベンチ、チューブ、懸垂マシンなどを組み合わせれば、十分に自宅トレーニング環境を作れます。",
  },
  {
    question: "マンションで特に注意したい器具はありますか？",
    answer:
      "高重量のラックやダンベルは床の保護、防音、防振を優先してください。ジョイントマットだけで足りない場合はゴムマットや防振材も検討します。",
  },
];

export async function generateMetadata({ searchParams }: RankingsPageProps): Promise<Metadata> {
  const { category } = await searchParams;
  const categories = getRankingProductCategories();
  const activeCategory = resolveActiveCategory(category, categories);
  const label = activeCategory ? productCategoryLabels[activeCategory] : "ホームジム用品";
  const description = activeCategory
    ? `${label}のおすすめ商品を、価格、向いている人、注意点で比較。自宅ジム作りに必要な器具選びを畳数や予算に合わせて検討できます。`
    : "ホームジム用品のカテゴリ別おすすめ商品。パワーラック、可変式ダンベル、トレーニングベンチ、床材・防振マットなど、各カテゴリの1位商品を確認できます。";
  const canonicalPath = activeCategory ? `/rankings?category=${activeCategory}` : "/rankings";

  return {
    title: activeCategory ? `${label}ランキング` : "カテゴリ別おすすめ商品",
    description,
    keywords: [
      ...baseSeoKeywords,
      ...rankingSeoKeywords,
      ...(activeCategory ? categorySeoKeywords[activeCategory] : []),
      label,
    ],
    alternates: {
      canonical: absoluteUrl(canonicalPath),
    },
    openGraph: {
      title: activeCategory ? `${label}ランキング | ${siteName}` : `カテゴリ別おすすめ商品 | ${siteName}`,
      description,
      url: absoluteUrl(canonicalPath),
      siteName,
      locale: "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: activeCategory ? `${label}ランキング | ${siteName}` : `カテゴリ別おすすめ商品 | ${siteName}`,
      description,
    },
  };
}

export default async function RankingsPage({ searchParams }: RankingsPageProps) {
  const { category } = await searchParams;
  const categories = getRankingProductCategories();
  const activeCategory = resolveActiveCategory(category, categories);
  const [products, currentUser] = await Promise.all([
    getRankingProductsWithAffiliateLinks(activeCategory ?? undefined),
    getHeaderUser(),
  ]);
  const pageTitle = activeCategory ? `${productCategoryLabels[activeCategory]}ランキング` : "カテゴリ別おすすめ商品";

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader currentUser={currentUser} showMobilePostButton={false} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createRankingJsonLd(products, activeCategory)).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <section className="grid gap-2">
          <h1 className="text-3xl font-black leading-tight tracking-normal sm:text-5xl">{pageTitle}</h1>

          <RankingCategoryFilter categories={categories} activeCategory={activeCategory} />

          <div className="hidden rounded-lg border border-[#cfd8cf] bg-white p-4 shadow-sm sm:block sm:p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-[#69756d]">
              <SearchCheck size={16} />
              表示カテゴリ
            </p>
            <CategoryLinks categories={categories} activeCategory={activeCategory} />
          </div>
        </section>

        <section className="mt-5 sm:mt-8">
          <div className="mb-3 flex flex-col justify-between gap-1 sm:mb-4 sm:flex-row sm:items-end sm:gap-2">
            <div>
              <p className="text-sm font-bold text-[#e4572e]">
                {activeCategory ? productCategoryLabels[activeCategory] : "カテゴリ別1位"}
              </p>
              <h2 className="text-2xl font-bold">{activeCategory ? "おすすめランキング" : "各カテゴリの1位"}</h2>
            </div>
            <p className="text-sm font-semibold text-[#69756d]">
              {activeCategory
                ? productCategoryDescriptions[activeCategory]
                : `${products.length}カテゴリの商品を表示中`}
            </p>
          </div>

          <div className="grid gap-4">
            {products.map((product) => (
              <RankingCard
                key={product.id}
                product={product}
                displayRank={product.rank}
                showCategory={!activeCategory}
              />
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-[#cfd8cf] pt-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-[#e4572e]">ホームジム用品の選び方</p>
            <h2 className="mt-2 text-2xl font-bold">畳数、予算、騒音リスクから逆算する</h2>
          </div>
          <div className="mt-5 divide-y divide-[#d8e0d6] border-y border-[#d8e0d6]">
            {rankingFaqs.map((item) => (
              <div key={item.question} className="py-3">
                <h3 className="font-bold leading-7">
                  <span className="text-[#e4572e]">Q. </span>
                  {item.question}
                </h3>
                <p className="mt-1 text-sm leading-7 text-[#3c4941]">
                  <span className="font-bold text-[#69756d]">A. </span>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function resolveActiveCategory(category: ProductCategory | string | undefined, categories: ProductCategory[]) {
  return categories.includes(category as ProductCategory) ? (category as ProductCategory) : null;
}

function createRankingJsonLd(products: RankingProduct[], activeCategory: ProductCategory | null) {
  const itemList = products.map((product, index) => {
    const aggregateRating = createAggregateRating(product);

    return {
      "@type": "ListItem",
      position: activeCategory ? product.rank : index + 1,
      url: absoluteUrl(`/rankings${activeCategory ? `?category=${activeCategory}` : ""}`),
      item: {
        "@type": "Product",
        name: product.name,
        brand: {
          "@type": "Brand",
          name: product.maker,
        },
        category: productCategoryLabels[product.category],
        image: product.image,
        description: product.summary,
        ...(aggregateRating ? { aggregateRating } : {}),
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "JPY",
          availability: "https://schema.org/InStock",
          url: product.productUrl,
        },
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: siteName, item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "ランキング", item: absoluteUrl("/rankings") },
        ],
      },
      {
        "@type": "ItemList",
        name: activeCategory ? `${productCategoryLabels[activeCategory]}ランキング` : "カテゴリ別おすすめ商品",
        numberOfItems: products.length,
        itemListElement: itemList,
      },
      {
        "@type": "FAQPage",
        mainEntity: rankingFaqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

function createAggregateRating(product: RankingProduct) {
  if (!product.reviewCount) return null;

  const ratingValue = Math.min(5, Math.max(1, product.rating));

  return {
    "@type": "AggregateRating",
    ratingValue,
    bestRating: 5,
    worstRating: 1,
    reviewCount: product.reviewCount,
  };
}

function CategoryLinks({
  categories,
  activeCategory,
}: {
  categories: ProductCategory[];
  activeCategory: ProductCategory | null;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Link
        href="/rankings"
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
          !activeCategory
            ? "border-[#e4572e] bg-[#e4572e] text-white"
            : "border-[#cfd8cf] bg-[#f7f8f5] text-[#4e5b52] hover:border-[#e4572e]"
        }`}
      >
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
            !activeCategory ? "border-white bg-white" : "border-[#c4cec4] bg-white"
          }`}
        >
          {!activeCategory ? <span className="h-2 w-2 rounded-sm bg-[#e4572e]" /> : null}
        </span>
        <span className="block min-w-0 font-bold">カテゴリ別1位</span>
      </Link>

      {categories.map((item) => (
        <Link
          key={item}
          href={`/rankings?category=${item}`}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            activeCategory === item
              ? "border-[#e4572e] bg-[#e4572e] text-white"
              : "border-[#cfd8cf] bg-[#f7f8f5] text-[#4e5b52] hover:border-[#e4572e]"
          }`}
        >
          <span
            className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
              activeCategory === item ? "border-white bg-white" : "border-[#c4cec4] bg-white"
            }`}
          >
            {activeCategory === item ? <span className="h-2 w-2 rounded-sm bg-[#e4572e]" /> : null}
          </span>
          <span className="block min-w-0 font-bold">{productCategoryLabels[item]}</span>
        </Link>
      ))}
    </div>
  );
}

function RankingCard({
  product,
  displayRank,
  showCategory,
}: {
  product: RankingProduct;
  displayRank: number;
  showCategory: boolean;
}) {
  const outboundUrl = product.affiliateUrl ?? product.productUrl;
  const rankStyle = getRankStyle(displayRank);

  return (
    <a
      href={outboundUrl}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className="pressable-card grid overflow-hidden rounded-lg border border-[#cfd8cf] bg-white shadow-sm lg:grid-cols-[260px_1fr]"
    >
      <div className="relative min-h-64 bg-white">
        <Image src={product.image} alt={product.name} fill className="object-contain p-4" sizes="(max-width: 1024px) 100vw, 260px" />
        <div
          className={`absolute left-3 top-3 flex min-w-20 items-center justify-center gap-1 rounded-lg px-3 py-2 shadow-lg shadow-black/20 ${rankStyle}`}
        >
          <Trophy size={17} fill="currentColor" />
          <span className="text-lg font-black">第{displayRank}位</span>
        </div>
        {showCategory ? (
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white">
            {productCategoryLabels[product.category]}
          </div>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-bold text-[#69756d]">{product.maker}</p>
            <h3 className="mt-1 text-2xl font-bold">{product.name}</h3>
          </div>
          <div className="shrink-0 rounded-lg bg-[#f7f8f5] p-3 md:min-w-40">
            <p className="text-xs font-bold text-[#69756d]">目安価格</p>
            <p className="mt-1 text-xl font-bold">{yen.format(product.price)}</p>
            <AmazonRating rating={product.rating} reviewCount={product.reviewCount} />
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[#eef7ee] p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-[#4e5b52]">
            <BadgeCheck size={17} />
            向いている人
          </p>
          <p className="mt-1 text-sm leading-6 text-[#3c4941]">{product.bestFor}</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <List title="良いところ" items={product.pros} />
          <List title="注意点" items={product.cons} />
        </div>

        <div className="mt-5 flex justify-end border-t border-[#cfd8cf] pt-4">
          <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e4572e] px-4 py-3 text-sm font-bold text-white">
            商品をチェック
            <ExternalLink size={16} />
          </span>
        </div>
      </div>
    </a>
  );
}

function getRankStyle(rank: number) {
  if (rank === 1) return "bg-[#d9a441] text-[#1f1600]";
  if (rank === 2) return "bg-[#b9c0c8] text-[#111820]";
  if (rank === 3) return "bg-[#b87333] text-white";
  return "bg-[#e4572e] text-white";
}

function AmazonRating({ rating, reviewCount }: { rating: number; reviewCount: number | null }) {
  const safeRating = Math.min(5, Math.max(0, rating));

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"
      aria-label={`5つ星のうち${safeRating.toFixed(1)}${reviewCount ? `、レビュー${reviewCount}件` : ""}`}
    >
      <span className="flex text-[18px] leading-none text-[#ffa41c]" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => {
          const fillPercent = Math.min(100, Math.max(0, (safeRating - index) * 100));

          return (
            <span key={index} className="relative inline-block h-[18px] w-[18px] text-[#d5d9d9]">
              <span className="absolute inset-0">★</span>
              <span className="absolute inset-0 overflow-hidden text-[#ffa41c]" style={{ width: `${fillPercent}%` }}>
                ★
              </span>
            </span>
          );
        })}
      </span>
      <span className="text-sm font-bold text-[#007185]">{safeRating.toFixed(1)}</span>
      {reviewCount ? <span className="text-xs font-bold text-[#69756d]">({reviewCount.toLocaleString("ja-JP")}件)</span> : null}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-[#cfd8cf] p-3">
      <p className="text-sm font-bold">{title}</p>
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-[#4e5b52]">
        {items.map((item) => (
          <li key={item}>・{item}</li>
        ))}
      </ul>
    </div>
  );
}
