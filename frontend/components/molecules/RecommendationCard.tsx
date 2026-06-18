import Image from "next/image";
import Link from "next/link";
import { Badge } from "../atoms/Badge";
import { RequiredDocumentList } from "./RequiredDocumentList";
import type { DashboardMember, TitleRecommendationResponse } from "@/lib/api/types";
import { getMemberTitleAction } from "@/lib/member-title-actions";
import { getOfferVisual } from "@/lib/offer-visuals";

type RecommendationCardProps = {
  memberId: string;
  member?: DashboardMember;
  recommendation: TitleRecommendationResponse;
};

export function RecommendationCard({ member, memberId, recommendation }: RecommendationCardProps) {
  const offer = recommendation.recommendedOffer;
  const memberAction = member ? getMemberTitleAction(member) : null;
  const subscriptionHref =
    offer.productType === "IMAGINE_R_JUNIOR" || offer.productType === "IMAGINE_R_SCHOOL"
      ? `/dashboard/family/subscriptions/imagine-r/new?memberId=${memberId}&offerId=${offer.id}`
      : `/dashboard/family/subscriptions/new?memberId=${memberId}&offerId=${offer.id}`;

  return (
    <article className="rounded-3xl border border-idfm-medium bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-idfm-light">
          <Image src={getOfferVisual(offer.productType)} alt="" width={84} height={84} className="h-20 w-20 object-contain" />
        </span>
        <div>
          <Badge tone="green">Offre recommandée</Badge>
          <h2 className="mt-3 text-2xl font-bold text-idfm-anthracite">{offer.name}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">{recommendation.reason}</p>
          <p className="mt-4 text-lg font-bold text-idfm-anthracite">{offer.priceLabel}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="font-bold text-idfm-anthracite">Documents à prévoir</h3>
          <div className="mt-3">
            <RequiredDocumentList documents={recommendation.requiredDocuments} />
          </div>
        </div>
        <div className="rounded-2xl bg-idfm-light p-5">
          <h3 className="font-bold text-idfm-anthracite">Pourquoi cette offre ?</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">{offer.shortDescription}</p>
          {memberAction && !memberAction.canStartSubscription ? (
            <div className="mt-5 rounded-2xl border border-idfm-medium bg-white p-4">
              <Badge tone={memberAction.statusTone}>{memberAction.statusLabel}</Badge>
              <p className="mt-3 text-sm leading-6 text-neutral-medium">{memberAction.message}</p>
              <Link
                href={memberAction.primaryHref}
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
              >
                {memberAction.primaryLabel}
              </Link>
            </div>
          ) : (
            <Link
              href={subscriptionHref}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
            >
              {recommendation.nextAction}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
