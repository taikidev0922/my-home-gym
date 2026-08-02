import { affiliateOffers } from "@/data/affiliate-offers";
import { isActiveAffiliateOffer, type AffiliateOffer } from "@/lib/affiliate-offers";

export function getAffiliateOffersForGeneration(): AffiliateOffer[] {
  return affiliateOffers.filter(isActiveAffiliateOffer);
}

export function getAffiliateOffersByIds(ids: string[]): Map<string, AffiliateOffer> {
  if (!ids.length) return new Map();

  const wanted = new Set(ids);

  return new Map(
    affiliateOffers
      .filter((offer) => wanted.has(offer.id) && isActiveAffiliateOffer(offer))
      .map((offer) => [offer.id, offer] as const),
  );
}
