"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const pendingEventName = "my-home-gym:blog-filter-pending";

type BlogPendingLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
  "aria-current"?: "page";
};

export function BlogPendingLink({ href, className, children, "aria-current": ariaCurrent }: BlogPendingLinkProps) {
  return (
    <Link
      href={href}
      aria-current={ariaCurrent}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }

        const nextUrl = new URL(href, window.location.origin);
        if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) {
          return;
        }

        window.dispatchEvent(new CustomEvent<string>(pendingEventName, { detail: `${nextUrl.pathname}${nextUrl.search}` }));
      }}
    >
      {children}
    </Link>
  );
}

export function BlogArticleListPending() {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentHref = `${pathname}${search ? `?${search}` : ""}`;

  useEffect(() => {
    function handlePending(event: Event) {
      setPendingHref(event instanceof CustomEvent && typeof event.detail === "string" ? event.detail : null);
    }

    window.addEventListener(pendingEventName, handlePending);
    return () => window.removeEventListener(pendingEventName, handlePending);
  }, []);

  const isPending = Boolean(pendingHref && pendingHref !== currentHref);
  if (!isPending) return null;

  return (
    <div className="absolute inset-0 z-20 bg-[#eef2ed]" aria-live="polite" aria-busy="true">
      <div className="mb-3 hidden sm:block">
        <SkeletonLine className="h-8 w-28" />
        <SkeletonLine className="mt-2 h-4 w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#cfd8cf] bg-white shadow-sm">
      <SkeletonLine className="aspect-video rounded-none" />
      <div className="p-4">
        <div className="flex gap-2">
          <SkeletonLine className="h-6 w-16 rounded-full" />
          <SkeletonLine className="h-6 w-24 rounded-full" />
        </div>
        <SkeletonLine className="mt-3 h-7 w-full" />
        <SkeletonLine className="mt-2 h-7 w-4/5" />
        <SkeletonLine className="mt-4 h-4 w-full" />
        <SkeletonLine className="mt-2 h-4 w-2/3" />
      </div>
    </div>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#dfe6dd] ${className}`} />;
}
