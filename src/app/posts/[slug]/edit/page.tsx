import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SubmitForm } from "@/components/submit-form";
import { getCurrentAuthUser } from "@/lib/auth-user";
import { getProfile, getUserPostBySlug } from "@/lib/gym-repository";

type EditPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { slug } = await params;
  const [profile, post] = await Promise.all([
    getProfile(user.id, user.email, user.name, user.avatarUrl),
    getUserPostBySlug(slug, user.id),
  ]);

  if (!post) {
    redirect("/me");
  }

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader currentUser={{ email: user.email, name: profile.displayName, avatarUrl: profile.avatarUrl || user.avatarUrl }} showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-lg border border-[#cfd8cf] bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-sm font-bold text-[#e4572e]">投稿を編集</p>
            <h1 className="mt-1 text-3xl font-bold">{post.title}</h1>
          </div>
          <SubmitForm
            mode="edit"
            initialPost={{
              id: post.id,
              slug: post.slug,
              title: post.title,
              areaTatami: post.areaTatami,
              budget: post.budget,
              scale: post.scale,
              summary: post.summary,
              tags: post.tags,
              images: post.images,
              categories: post.gear.map((item) => item.category),
            }}
          />
        </div>
      </div>
    </main>
  );
}
