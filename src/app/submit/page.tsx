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
    <main className="min-h-screen bg-[#090909] px-4 py-6 text-[#f4f4f5] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#c8c8cc]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>
        <div className="mt-6 rounded-lg border border-white/10 bg-[#151515] p-5 shadow-sm sm:p-7">
          <div>
            <h1 className="text-3xl font-bold">ホームジムを投稿</h1>
          </div>
          <SubmitForm />
        </div>
      </div>
    </main>
  );
}
