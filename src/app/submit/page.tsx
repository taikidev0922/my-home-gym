import { SiteHeader } from "@/components/site-header";
import { SubmitForm } from "@/components/submit-form";

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-lg border border-[#cfd8cf] bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h1 className="text-3xl font-bold">ホームジムを投稿</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#69756d]">
              会員登録なしで誰でも投稿できます。ニックネームやアイコン、SNSリンクは任意で設定できます。
            </p>
          </div>
          <SubmitForm />
        </div>
      </div>
    </main>
  );
}
