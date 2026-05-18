import Image from "next/image";
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Ruler, Tags, WalletCards } from "lucide-react";
import { PostDetailLoadingSkeleton } from "@/components/page-skeletons";
import { PostImageGallery } from "@/components/post-image-gallery";
import { SiteHeader } from "@/components/site-header";
import { formatTatami } from "@/lib/area";
import { scaleLabels } from "@/lib/gym-data";
import { getPublishedPostBySlug } from "@/lib/gym-repository";
import { getHeaderUser } from "@/lib/header-user";
import { absoluteUrl, baseSeoKeywords, siteName } from "@/lib/seo";
import type { HomeGymPost } from "@/lib/types";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

type PostDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "投稿が見つかりません",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const categoryNames = post.gear.map((item) => item.name);
  const description =
    post.summary ||
    `${post.title}のホームジム投稿。広さ${formatTatami(post.areaTatami)}、初期費用${yen.format(post.budget)}、器具カテゴリを確認できます。`;

  return {
    title: `${post.title}のホームジム`,
    description,
    keywords: [
      ...baseSeoKeywords,
      ...categoryNames,
      ...post.tags,
      `${formatTatami(post.areaTatami)} ホームジム`,
      `${scaleLabels[post.scale]} ホームジム`,
    ],
    alternates: {
      canonical: absoluteUrl(`/posts/${post.slug}`),
    },
    openGraph: {
      title: `${post.title}のホームジム | ${siteName}`,
      description,
      url: absoluteUrl(`/posts/${post.slug}`),
      siteName,
      locale: "ja_JP",
      type: "article",
      images: post.images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title}のホームジム | ${siteName}`,
      description,
      images: post.images,
    },
  };
}

export default function PostDetail(props: PostDetailProps) {
  return (
    <Suspense fallback={<PostDetailLoadingSkeleton />}>
      <PostDetailContent {...props} />
    </Suspense>
  );
}

async function PostDetailContent({ params }: PostDetailProps) {
  const { slug } = await params;
  const [post, currentUser] = await Promise.all([
    getPublishedPostBySlug(slug),
    getHeaderUser(),
  ]);

  if (!post) {
    return (
      <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
        <SiteHeader currentUser={currentUser} showMobilePostButton={false} />
        <div className="grid min-h-[60vh] place-items-center p-6">
          <div className="rounded-lg border border-[#cfd8cf] bg-white p-8 text-center">
            <h1 className="text-2xl font-bold">投稿が見つかりません</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader currentUser={currentUser} showMobilePostButton={false} />
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <section className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_420px]">
          <PostImageGallery images={post.images} title={post.title} />

          <aside className="grid h-fit min-w-0 gap-3 sm:gap-4 lg:sticky lg:top-6">
            <div className="min-w-0 rounded-lg border border-[#cfd8cf] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-lg bg-[#e4572e] px-3 py-1.5 text-sm font-black text-white">{scaleLabels[post.scale]}</span>
                <span className="text-sm font-bold text-[#69756d]">写真 {post.images.length}枚</span>
              </div>
              <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-normal sm:text-4xl">{post.title}</h1>
              <p className="mt-4 leading-8 text-[#4e5b52]">{post.summary || "説明はまだありません。"}</p>
            </div>

            <AuthorCard post={post} />

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Stat icon={<Ruler size={17} />} label="広さ" value={formatTatami(post.areaTatami)} />
              <Stat icon={<WalletCards size={17} />} label="初期費用" value={yen.format(post.budget)} />
            </div>
          </aside>
        </section>

        <section className="mt-4 grid gap-3 sm:mt-6 sm:gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-lg border border-[#cfd8cf] bg-white p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Tags size={20} />
              器具カテゴリ
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.gear.length ? (
                post.gear.map((item) => (
                  <span key={`${item.category}-${item.name}`} className="rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2 text-sm font-bold text-[#4e5b52]">
                    {item.name}
                  </span>
                ))
              ) : (
                <p className="text-sm font-semibold text-[#69756d]">カテゴリは未設定です。</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#cfd8cf] bg-white p-4 sm:p-5">
            <h2 className="text-xl font-bold">タグ</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.length ? (
                post.tags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-[#f7f8f5] px-3 py-2 text-sm font-semibold text-[#3c4941]">
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm font-semibold text-[#69756d]">タグは未設定です。</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthorCard({ post }: { post: HomeGymPost }) {
  return (
    <div className="rounded-lg border border-[#cfd8cf] bg-white p-4 sm:p-5">
      <p className="text-sm font-bold text-[#69756d]">投稿者</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e4572e] text-xl font-black text-white">
          {post.ownerAvatarUrl ? (
            <Image src={post.ownerAvatarUrl} alt={post.owner} width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            post.owner.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{post.owner}</p>
          <SocialLinks sns={post.sns} />
        </div>
      </div>
    </div>
  );
}

function SocialLinks({ sns }: { sns: HomeGymPost["sns"] }) {
  const links = [
    { key: "instagram", label: "Instagram", href: sns.instagram, icon: <InstagramIcon />, className: "text-[#e4405f]" },
    { key: "x", label: "X", href: sns.x, icon: <XIcon />, className: "text-black" },
    { key: "tiktok", label: "TikTok", href: sns.tiktok, icon: <TikTokIcon />, className: "" },
  ].filter((item): item is (typeof item) & { href: string } => Boolean(item.href));

  if (!links.length) {
    return <p className="mt-1 text-sm font-semibold text-[#7a817b]">SNSリンク未設定</p>;
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      {links.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          className={`grid h-9 w-9 place-items-center rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] hover:border-[#e4572e] ${item.className}`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="currentColor">
      <path d="M13.7 10.7 20.4 3h-1.6l-5.9 6.7L8.3 3H3l7.1 10.3L3 21h1.6l6.2-6.9 4.9 6.9H21l-7.3-10.3Zm-2.2 2.5-.7-1L5.1 4.2h2.4l4.5 6.3.7 1 6 8.4h-2.4l-4.8-6.7Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="none">
      <path d="M15.9 3.8c.3 2.3 1.7 3.6 4 3.9v2.8c-1.4.1-2.6-.3-3.9-1v5.4c0 6.8-7.5 8.9-10.5 4-1.9-3.1-.7-8.7 5.5-8.9v3.1c-.5.1-.9.2-1.4.4-1.4.6-2.1 1.9-1.7 3.2.7 2.6 5 2.1 4.7-1.6V3.8h3.3Z" fill="#25F4EE" />
      <path d="M14.8 3c.3 2.4 1.7 3.9 4.1 4.1v3.2c-1.4.1-2.7-.3-4-1.1V15c0 7.3-8 9.6-11.2 4.3-2.1-3.4-.8-9.4 5.9-9.6v3.4c-.5.1-1 .2-1.5.4-1.5.6-2.3 2-1.9 3.5.8 2.8 5.4 2.3 5-1.7V3h3.6Z" fill="#111111" />
      <path d="M17.6 7.4c.4.1.8.2 1.3.2v2.8c-1.4.1-2.7-.3-4-1.1v.7c.8.5 1.7.7 2.7.8V7.4ZM9.6 9.8v3.4c-.5.1-1 .2-1.5.4-.8.3-1.4.9-1.7 1.5-.2-2.8 1.2-5.1 3.2-5.3Z" fill="#FE2C55" />
    </svg>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#cfd8cf] bg-white p-3">
      <p className="flex items-center gap-1 text-xs font-bold text-[#69756d]">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-words font-bold">{value}</p>
    </div>
  );
}

