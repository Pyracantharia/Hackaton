import Image from "next/image";
import Link from "next/link";
import { Badge } from "../atoms/Badge";
import type { ProductOffer } from "@/lib/api/types";
import { getOfferVisual } from "@/lib/offer-visuals";

type OfferCardProps = {
  ctaLabel?: string;
  href: string;
  offer: ProductOffer;
};

export function OfferCard({ ctaLabel = "Voir l'offre", href, offer }: OfferCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-neutral-light bg-white p-5 shadow-sm transition hover:border-idfm-interaction hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-idfm-light">
          <Image src={getOfferVisual(offer.productType)} alt="" width={56} height={56} className="h-12 w-12 object-contain" />
        </span>
        <Badge tone="blue">{offer.durationLabel}</Badge>
      </div>
      <h3 className="mt-5 text-lg font-bold text-idfm-anthracite">{offer.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-neutral-medium">{offer.shortDescription}</p>
      <p className="mt-4 text-base font-bold text-idfm-anthracite">{offer.priceLabel}</p>
      <span className="mt-5 text-sm font-bold text-idfm-interaction group-hover:underline">{ctaLabel}</span>
    </Link>
  );
}
