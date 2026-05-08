import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SubmitForm } from "@/components/submit-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SubmitPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#122018]">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-lg border border-[#ded6ca] bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h1 className="text-3xl font-bold">ホームジムを投稿</h1>
          </div>
          <SubmitForm />
        </div>
      </div>
    </main>
  );
}

