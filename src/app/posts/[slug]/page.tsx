import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Heart, Ruler, WalletCards } from "lucide-react";
import { gymPosts, scaleLabels } from "@/lib/gym-data";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function generateStaticParams() {
  return gymPosts.map((post) => ({ slug: post.slug }));
}

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = gymPosts.find((item) => item.slug === slug);

  if (!post) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f3ee] p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">投稿が見つかりません</h1>
          <Link href="/" className="mt-4 inline-flex rounded-lg bg-[#18251f] px-4 py-3 font-bold text-white">
            一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#1f2522]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#516158]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>

        <section className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
              <Image src={post.images[0]} alt={post.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {post.images.slice(1).map((image) => (
                <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
                  <Image src={image} alt={`${post.title} の写真`} fill className="object-cover" sizes="33vw" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#e4572e]">{scaleLabels[post.scale]}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight">{post.title}</h1>
            <p className="mt-3 text-[#5f6c64]">{post.owner} / {post.location}</p>
            <p className="mt-5 leading-8 text-[#4d5a52]">{post.summary}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat icon={<Ruler size={17} />} label="広さ" value={`${post.areaSqm}㎡`} />
              <Stat icon={<WalletCards size={17} />} label="初期費用" value={yen.format(post.budget)} />
              <Stat icon={<Heart size={17} />} label="保存" value={`${post.saved}`} />
            </div>

            <h2 className="mt-7 text-lg font-bold">こだわり</h2>
            <ul className="mt-3 grid gap-2">
              {post.highlights.map((item) => (
                <li key={item} className="rounded-lg bg-[#f7f4ee] px-3 py-2 text-sm font-semibold text-[#536057]">
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="mt-7 text-lg font-bold">使用アイテム</h2>
            <div className="mt-3 grid gap-3">
              {post.gear.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3 hover:bg-[#faf8f3]"
                >
                  <span>
                    <span className="block font-bold">{item.name}</span>
                    <span className="text-sm text-[#667168]">{item.maker} / {item.category}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm font-bold text-[#e4572e]">
                    {yen.format(item.price)}
                    <ExternalLink size={16} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7f4ee] p-3">
      <p className="flex items-center gap-1 text-xs font-bold text-[#798279]">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
