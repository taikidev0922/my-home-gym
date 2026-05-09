import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Heart, ImageIcon, Settings, User } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { formatTatami } from "@/lib/area";
import { getCurrentAuthUser } from "@/lib/auth-user";
import { getLikedPosts, getProfile, getUserPosts } from "@/lib/gym-repository";
import type { HomeGymPost } from "@/lib/types";

export default async function MyPage() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [profile, myPosts, likedPosts] = await Promise.all([
    getProfile(user.id, user.email, user.name, user.avatarUrl),
    getUserPosts(user.id),
    getLikedPosts(user.id),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#122018]">
      <SiteHeader currentUser={{ email: user.email, name: profile.displayName, avatarUrl: profile.avatarUrl || user.avatarUrl }} showMobilePostButton={false} />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="rounded-lg border border-[#ded6ca] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-[#e4572e] text-2xl font-bold text-white">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={profile.displayName} width={64} height={64} className="h-full w-full object-cover" />
              ) : (
                profile.displayName.slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#e4572e]">マイページ</p>
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              <p className="mt-1 text-sm text-[#69756d]">{user.email}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-[#ded6ca] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Settings size={20} />
              プロフィール・SNS設定
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#69756d]">
              投稿詳細やカードに表示する名前、アイコン、SNSリンクを設定できます。
            </p>
            <div className="mt-5">
              <ProfileForm profile={profile} />
            </div>
          </div>

          <div className="grid gap-4">
            <SummaryCard icon={<ImageIcon size={19} />} label="自分の投稿" value={`${myPosts.length}件`} />
            <SummaryCard icon={<Heart size={19} />} label="自分がいいねした投稿" value={`${likedPosts.length}件`} />
            <SummaryCard icon={<User size={19} />} label="公開プロフィール" value={profile.displayName} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <PostList title="自分の投稿" description="あなたが投稿したホームジムです。" empty="まだ投稿がありません。" posts={myPosts} />
          <PostList title="自分がいいねした投稿" description="あなたがいいねした投稿です。" empty="まだいいねした投稿がありません。" posts={likedPosts} />
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#ded6ca] bg-white p-5 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-bold text-[#69756d]">{icon}{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function PostList({
  title,
  description,
  empty,
  posts,
}: {
  title: string;
  description: string;
  empty: string;
  posts: HomeGymPost[];
}) {
  return (
    <div className="rounded-lg border border-[#ded6ca] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-[#69756d]">{description}</p>
      <div className="mt-4 grid gap-3">
        {posts.length ? posts.map((post) => <MiniPost key={post.id} post={post} />) : (
          <p className="rounded-lg bg-[#f3efe7] p-4 text-sm font-semibold text-[#69756d]">{empty}</p>
        )}
      </div>
    </div>
  );
}

function MiniPost({ post }: { post: HomeGymPost }) {
  return (
    <Link href={`/posts/${post.slug}`} className="grid grid-cols-[88px_1fr] gap-3 rounded-lg border border-[#ded6ca] p-2 hover:bg-[#eee8df]">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f3efe7]">
        <Image src={post.images[0]} alt={post.title} fill className="object-cover" sizes="88px" />
      </div>
      <div className="min-w-0 py-1">
        <p className="truncate font-bold">{post.title}</p>
        <p className="mt-1 text-sm text-[#69756d]">{formatTatami(post.areaTatami)} / {post.budget.toLocaleString("ja-JP")}円</p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#e4572e]">
          詳細を見る
          <ExternalLink size={13} />
        </p>
      </div>
    </Link>
  );
}

