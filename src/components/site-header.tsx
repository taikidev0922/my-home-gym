"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Menu } from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";

export type HeaderUser = {
  email: string;
  name: string;
  avatarUrl: string;
} | null;

type SiteHeaderProps = {
  currentUser?: HeaderUser;
  onSubmitNav?: (event: MouseEvent<HTMLAnchorElement>) => void;
  showMobilePostButton?: boolean;
};

export function SiteHeader({
  currentUser = null,
  onSubmitNav,
  showMobilePostButton = true,
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#cfd8cf] bg-[#eef2ed]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 shrink-0">
            <Link href="/" className="flex items-center" aria-label="マイホームジム">
              <Image
                src="/brand/logo.svg"
                alt="My Home Gym"
                width={186}
                height={40}
                priority
                className="h-9 w-[166px] object-contain sm:h-10 sm:w-[190px]"
              />
            </Link>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 text-sm font-medium text-[#3c4941] md:flex lg:gap-5">
            <Link href="/">みんなのホームジム</Link>
            <Link href="/rankings">器具ランキング</Link>
            <Link href="/blog">ホームジムお助け記事</Link>
          </nav>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <Link href="/me" aria-label="マイページ" title="マイページ" className="flex items-center rounded-full">
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#e4572e] text-sm font-bold text-white ring-1 ring-[#cfd8cf]">
                  {currentUser.avatarUrl ? (
                    <Image
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    currentUser.name.slice(0, 1).toUpperCase()
                  )}
                </span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex h-10 items-center rounded-lg bg-[#e4572e] px-3 text-sm font-bold text-white shadow-sm"
              >
                ログイン
              </Link>
            )}

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
              onClick={onSubmitNav}
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
            {currentUser ? (
              <Link
                href="/me"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl bg-[#f7f8f5] px-4 py-3.5 text-[#122018] hover:bg-[#e1e8df]"
              >
                マイページ
              </Link>
            ) : null}
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3.5 hover:bg-[#f7f8f5]">
              みんなのホームジム
            </Link>
            <Link href="/rankings" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3.5 hover:bg-[#f7f8f5]">
              器具ランキング
            </Link>
            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="rounded-xl px-4 py-3.5 hover:bg-[#f7f8f5]">
              ホームジムお助け記事
            </Link>
          </nav>
        </>
      ) : null}

      {showMobilePostButton ? (
        <Link
          href="/submit"
          onClick={onSubmitNav}
          className="fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e4572e] text-white shadow-xl shadow-black/20 sm:hidden"
          aria-label="投稿"
        >
          <Camera size={22} />
        </Link>
      ) : null}
    </>
  );
}
