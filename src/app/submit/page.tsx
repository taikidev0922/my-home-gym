import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 text-[#122018] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#3c4941]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>
        <div className="mt-6 rounded-lg border border-[#ded6ca] bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h1 className="text-3xl font-bold">ホームジムを投稿</h1>
          </div>
          <SubmitForm />
        </div>
      </div>
    </main>
  );
}
