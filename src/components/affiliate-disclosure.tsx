type AffiliateDisclosureProps = {
  className?: string;
};

export function AffiliateDisclosure({ className = "" }: AffiliateDisclosureProps) {
  return (
    <aside
      className={`rounded-lg border border-[#d8ded5] bg-white/80 px-3 py-2 text-xs font-semibold leading-6 text-[#4e5b52] ${className}`}
    >
      本ページには広告リンクが含まれます。Amazonのアソシエイトとして、マイホームジムは適格販売により収入を得ています。
    </aside>
  );
}

