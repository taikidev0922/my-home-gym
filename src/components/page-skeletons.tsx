function SkeletonHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#cfd8cf] bg-[#eef2ed]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="h-9 w-[166px] rounded-lg bg-white sm:h-10 sm:w-[190px]" />
        <div className="hidden flex-1 justify-center gap-4 md:flex">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-16 rounded-lg bg-[#e4572e]/30" />
          <div className="h-10 w-10 rounded-lg bg-white md:hidden" />
        </div>
      </div>
    </header>
  );
}

export function HomeLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SkeletonHeader />
      <section className="mx-auto max-w-7xl px-4 pb-1 pt-2 sm:px-6 sm:pb-3 sm:pt-6">
        <SkeletonLine className="h-8 w-64 sm:h-11 sm:w-[420px]" />
      </section>
      <section className="mx-auto grid max-w-7xl gap-2 px-0 py-2 sm:gap-5 sm:px-6 sm:py-5 lg:grid-cols-[300px_1fr]">
        <aside className="mx-3 rounded-lg border border-[#cfd8cf] bg-white p-4 sm:mx-0">
          <SkeletonLine className="h-5 w-28" />
          <div className="mt-5 grid gap-3">
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-24 w-full" />
            <SkeletonLine className="h-11 w-full bg-[#e4572e]/25" />
          </div>
        </aside>
        <div className="min-w-0">
          <div className="mb-2 flex justify-between px-3 sm:mb-4 sm:px-0">
            <div className="hidden sm:block">
              <SkeletonLine className="h-7 w-52" />
              <SkeletonLine className="mt-2 h-4 w-32" />
            </div>
            <div className="flex gap-1">
              <SkeletonLine className="h-9 w-9" />
              <SkeletonLine className="h-9 w-9" />
            </div>
          </div>
          <PostGridSkeleton />
        </div>
      </section>
    </main>
  );
}

export function PostDetailLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SkeletonHeader />
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_420px]">
          <SkeletonLine className="aspect-square w-full sm:aspect-[4/3]" />
          <aside className="grid h-fit gap-3 sm:gap-4">
            <div className="rounded-lg border border-[#cfd8cf] bg-white p-4 sm:p-5">
              <div className="flex justify-between">
                <SkeletonLine className="h-8 w-24 bg-[#e4572e]/25" />
                <SkeletonLine className="h-5 w-20" />
              </div>
              <SkeletonLine className="mt-4 h-9 w-4/5" />
              <SkeletonLine className="mt-4 h-5 w-full" />
              <SkeletonLine className="mt-2 h-5 w-2/3" />
            </div>
            <SkeletonCard />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export function BlogListLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SkeletonHeader />
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <SkeletonLine className="h-10 w-72 sm:h-14 sm:w-96" />
        <SkeletonCard className="mt-4 hidden h-32 sm:block" />
        <div className="mt-4 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}

export function BlogArticleLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SkeletonHeader />
      <div className="mx-auto max-w-4xl px-0 py-5 sm:px-6 sm:py-6">
        <article className="px-4 pb-8 pt-2 sm:rounded-lg sm:border sm:border-[#cfd8cf] sm:bg-white sm:p-8">
          <div className="flex gap-2">
            <SkeletonLine className="h-7 w-24" />
            <SkeletonLine className="h-7 w-32" />
          </div>
          <SkeletonLine className="mt-5 h-10 w-full sm:h-14" />
          <SkeletonLine className="mt-3 h-10 w-4/5 sm:h-14" />
          <SkeletonLine className="-mx-4 mt-6 aspect-video sm:mx-0 sm:rounded-lg" />
          <div className="mt-8 grid gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <SkeletonLine className="h-8 w-2/3" />
                <SkeletonLine className="mt-4 h-5 w-full" />
                <SkeletonLine className="mt-2 h-5 w-full" />
                <SkeletonLine className="mt-2 h-5 w-5/6" />
              </div>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}

export function RankingsLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SkeletonHeader />
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <SkeletonLine className="h-10 w-80 sm:h-14 sm:w-[460px]" />
        <SkeletonCard className="mt-4 hidden h-28 sm:block" />
        <div className="mt-5 grid gap-4 sm:mt-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid overflow-hidden rounded-lg border border-[#cfd8cf] bg-white lg:grid-cols-[260px_1fr]">
              <SkeletonLine className="min-h-64 rounded-none" />
              <div className="p-5">
                <SkeletonLine className="h-5 w-24" />
                <SkeletonLine className="mt-2 h-8 w-3/4" />
                <SkeletonLine className="mt-4 h-5 w-full" />
                <SkeletonLine className="mt-2 h-5 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function AccountLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SkeletonHeader />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <SkeletonCard className="h-32" />
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <SkeletonCard className="h-96" />
          <div className="grid gap-4">
            <SkeletonCard className="h-24" />
            <SkeletonCard className="h-24" />
            <SkeletonCard className="h-24" />
          </div>
        </section>
      </div>
    </main>
  );
}

export function SubmitLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SkeletonHeader />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-lg border border-[#cfd8cf] bg-white p-5 shadow-sm sm:p-7">
          <SkeletonLine className="h-9 w-64" />
          <SkeletonLine className="mt-7 h-12 w-full" />
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full" />
          </div>
          <SkeletonLine className="mt-5 h-56 w-full" />
          <SkeletonLine className="mt-5 h-40 w-full" />
        </div>
      </div>
    </main>
  );
}

function PostGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px bg-transparent sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden bg-white sm:rounded-lg sm:border sm:border-[#cfd8cf]">
          <SkeletonLine className="aspect-square rounded-none sm:aspect-[4/3]" />
          <div className="hidden p-4 sm:block">
            <SkeletonLine className="h-5 w-4/5" />
            <SkeletonLine className="mt-2 h-4 w-28" />
            <SkeletonLine className="mt-4 h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#cfd8cf] bg-white">
      <SkeletonLine className="aspect-video rounded-none" />
      <div className="p-4">
        <SkeletonLine className="h-6 w-20" />
        <SkeletonLine className="mt-3 h-7 w-full" />
        <SkeletonLine className="mt-2 h-7 w-4/5" />
        <SkeletonLine className="mt-4 h-4 w-full" />
      </div>
    </div>
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg border border-[#cfd8cf] bg-white p-4 shadow-sm ${className}`} />;
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#dfe6dd] ${className}`} />;
}
