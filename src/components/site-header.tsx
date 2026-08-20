"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Menu } from "lucide-react";
import { useState } from "react";

type SiteHeaderProps = {
  showMobilePostButton?: boolean;
};

export function SiteHeader({ showMobilePostButton = true }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#cfd8cf] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1 sm:px-6">
          <div className="min-w-0 shrink-0">
            <Link href="/" className="flex items-center" aria-label="マイホームジム">
              <span className="block h-8 w-8 shrink-0 overflow-hidden sm:h-9 sm:w-9">
                <Image
                  src="/brand/favicon.webp"
                  alt=""
                  width={36}
                  height={36}
                  priority
                  className="h-full w-full scale-[1.16] object-contain"
                />
              </span>
              <span className="ml-2 whitespace-nowrap text-xl font-black leading-none tracking-normal text-[#24313d] sm:text-2xl">
                マイ<span className="text-[#fe4d25]">ホーム</span>ジム
              </span>
            </Link>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 text-sm font-medium text-[#3c4941] md:flex lg:gap-5">
            <Link href="/">みんなのホームジム</Link>
            <Link href="/rankings">器具ランキング</Link>
            <Link href="/blog">ホームジムお助け記事</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#cfd8cf] bg-white text-[#122018] md:hidden"
              aria-label="メニュー"
              aria-expanded={isMenuOpen}
            >
              <Menu size={20} />
            </button>

            <Link
              href="/submit"
              className="hidden items-center gap-2 rounded-lg bg-[#e4572e] px-3 py-2 text-sm font-semibold text-white shadow-sm sm:inline-flex"
            >
              <Camera size={16} />
              投稿
            </Link>
          </div>
        </div>
      </header>

      {isMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] md:hidden"
            aria-label="メニューを閉じる"
            onClick={() => setIsMenuOpen(false)}
          />
          <nav className="fixed right-4 top-16 z-50 grid w-[min(320px,calc(100vw-2rem))] gap-2 rounded-2xl border border-[#cfd8cf] bg-white p-3 text-base font-bold text-[#4e5b52] shadow-2xl shadow-black/25 md:hidden">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3.5 hover:bg-[#f7f8f5]">
              みんなのホームジム
            </Link>
            <Link href="/rankings" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3.5 hover:bg-[#f7f8f5]">
              器具ランキング
            </Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3.5 hover:bg-[#f7f8f5]">
              ホームジムお助け記事
            </Link>
            <Link href="/submit" onClick={() => setIsMenuOpen(false)} className="rounded-xl bg-[#f7f8f5] px-4 py-3.5 text-[#122018] hover:bg-[#e1e8df]">
              ホームジムを投稿
            </Link>
          </nav>
        </>
      ) : null}

      {showMobilePostButton ? (
        <Link
          href="/submit"
          className="fixed bottom-5 right-4 z-40 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#e4572e] px-5 text-base font-bold text-white shadow-xl shadow-black/20 sm:hidden"
        >
          <Camera size={20} />
          投稿する
        </Link>
      ) : null}
    </>
  );
}
