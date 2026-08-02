export type AffiliateOfferKind = "estimate" | "consultation" | "trial";

export type AffiliateOffer = {
  id: string;
  /** 広告主名。カード下部の提供元表記に使う */
  provider: string;
  /** サービス名 */
  serviceName: string;
  /** ASPで発行した広告リンク。未提携・未承認の間は空文字にしておく（空ならカードは描画されない） */
  affiliateUrl: string;
  /** 成果地点の種類 */
  kind: AffiliateOfferKind;
  /** カード見出し。読者の状況を言い当てる一文にする */
  headline: string;
  /** 見出しの補足。何ができるサービスかを具体的に書く */
  description: string;
  /** 判断材料の箇条書き。3項目前後 */
  points: string[];
  /** ボタン文言 */
  actionLabel: string;
  /** 料金や連絡方法など、読者が気にする前提の注記 */
  note?: string;
  /** 記事生成時の配置判断に使う補助情報 */
  matchContexts: string[];
  avoidContexts: string[];
};

export const affiliateOfferKindLabels: Record<AffiliateOfferKind, string> = {
  estimate: "無料見積もり",
  consultation: "無料相談",
  trial: "無料体験",
};

export function isActiveAffiliateOffer(offer: AffiliateOffer) {
  return offer.affiliateUrl.trim().length > 0;
}

function joinList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(" / ") || "なし";
}

export function formatAffiliateOffersForPrompt(offers: AffiliateOffer[]) {
  return offers
    .map((offer) =>
      [
        `- id: ${offer.id}`,
        `サービス名: ${offer.serviceName}`,
        `提供元: ${offer.provider}`,
        `成果地点: ${affiliateOfferKindLabels[offer.kind]}`,
        `内容: ${offer.description}`,
        `向く文脈: ${joinList(offer.matchContexts)}`,
        `避ける文脈: ${joinList(offer.avoidContexts)}`,
      ].join(" / "),
    )
    .join("\n");
}

export function buildAffiliateOfferPromptSection(offers: AffiliateOffer[]) {
  const activeOffers = offers.filter(isActiveAffiliateOffer);

  if (!activeOffers.length) return "";

  return `
サービス紹介カード方針:
- サービス紹介カードは商品カードとは別枠で、1記事につき最大1つまで挿入できる。
- 挿入するときは paragraphs 内に単独の文字列として {{offer:サービスID}} を入れる。例: "{{offer:reform-estimate-1}}"
- 使えるのは下の一覧にある id だけ。同じ記事に2つ以上入れない。
- 「器具を買っても解決しない悩み」に読者が直面している箇所にだけ置く。器具の購入で解決する話題では使わない。
- 直前の段落で「どういう条件ならこのサービスを検討する価値があるか」を具体的に書いてからカードへつなげる。該当しない読者には不要だと明示する。
- 「必ず必要」「今すぐ申し込むべき」といった煽る表現は使わない。判断材料を示して読者自身に選ばせる。
- 記事の主題と関係が薄い場合は入れない。無理に入れるより入れないほうがよい。

利用できるサービスリンク:
${formatAffiliateOffersForPrompt(activeOffers)}
`;
}
