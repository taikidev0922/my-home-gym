import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Suspense } from "react";
import { SubmitLoadingSkeleton } from "@/components/page-skeletons";
import { SubmitForm } from "@/components/submit-form";
import { getCurrentAuthUser } from "@/lib/auth-user";
import { getProfile } from "@/lib/gym-repository";

export default function SubmitPage() {
  return (
    <Suspense fallback={<SubmitLoadingSkeleton />}>
      <SubmitPageContent />
    </Suspense>
  );
}

async function SubmitPageContent() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getProfile(user.id, user.email, user.name, user.avatarUrl);

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader currentUser={{ email: user.email, name: profile.displayName, avatarUrl: profile.avatarUrl || user.avatarUrl }} showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-lg border border-[#cfd8cf] bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h1 className="text-3xl font-bold">ホームジムを投稿</h1>
          </div>
          <SubmitForm />
        </div>
      </div>
    </main>
  );
}
