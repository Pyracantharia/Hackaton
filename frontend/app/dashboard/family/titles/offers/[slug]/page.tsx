"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/atoms/Badge";
import { InfoBox } from "@/components/molecules/InfoBox";
import { OfferCard } from "@/components/molecules/OfferCard";
import { RequiredDocumentList } from "@/components/molecules/RequiredDocumentList";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { getTitleOfferDetail } from "@/lib/api/titles";
import type { ProductOffer, ProductOfferDetail } from "@/lib/api/types";
import { titleOffersMock } from "@/lib/demo/titleOffersMock";
import { getOfferVisual } from "@/lib/offer-visuals";

function buildMockDetail(slug: string): ProductOfferDetail {
  const offer = titleOffersMock.find((candidate) => candidate.slug === slug) ?? titleOffersMock[0];
  return {
    ...offer,
    relatedOffers: titleOffersMock
      .filter((candidate) => candidate.id !== offer.id && candidate.targetProfile === offer.targetProfile)
      .slice(0, 3),
  };
}

function OfferBenefits({ benefits }: { benefits: ProductOffer["benefits"] }) {
  return (
    <ul className="grid gap-3">
      {benefits.map((benefit) => (
        <li key={benefit.id} className="flex items-center gap-3 text-sm text-neutral-medium">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-idfm-medium text-idfm-focus" aria-hidden="true">
            ✓
          </span>
          <span>{benefit.label}</span>
        </li>
      ))}
    </ul>
  );
}

function OfferDetailContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [offer, setOffer] = useState<ProductOfferDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffer() {
      try {
        setOffer(await getTitleOfferDetail(slug));
      } catch (error) {
        setOffer(buildMockDetail(slug));
        setLoadError(error instanceof Error ? error.message : "Fiche offre affichee en mode demo.");
      }
    }

    void loadOffer();
  }, [slug]);

  const currentOffer = useMemo(() => offer ?? buildMockDetail(slug), [offer, slug]);

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { href: "/dashboard/family/titles", label: "Titres" },
        { label: currentOffer.name },
      ]}
      subtitle="Consultez l'offre, les documents attendus et demarrez une demande si elle correspond au foyer."
      summaryItems={[currentOffer.durationLabel, currentOffer.priceLabel, "Demande sans titre actif"]}
      title={currentOffer.name}
      userName="Mon espace"
    >
      <div className="grid gap-10">
        {loadError ? <InfoBox>{loadError} Donnees de demonstration affichees.</InfoBox> : null}

        <section className="grid gap-8 rounded-3xl border border-neutral-light bg-white p-6 shadow-sm lg:grid-cols-[0.8fr_1fr] lg:items-center">
          <div className="flex min-h-72 items-center justify-center rounded-3xl bg-idfm-light">
            <Image
              src={getOfferVisual(currentOffer.productType)}
              alt=""
              width={280}
              height={220}
              className="h-56 w-auto object-contain"
              priority
            />
          </div>
          <div>
            <Badge tone="blue">{currentOffer.targetProfile}</Badge>
            <h2 className="mt-4 text-4xl font-bold text-idfm-anthracite">{currentOffer.name}</h2>
            <p className="mt-3 text-lg leading-8 text-neutral-medium">{currentOffer.longDescription}</p>
            <p className="mt-6 text-3xl font-bold text-idfm-anthracite">{currentOffer.priceLabel}</p>
            <div className="mt-6">
              <OfferBenefits benefits={currentOffer.benefits} />
            </div>
            <Link
              href="/dashboard/family/titles/recommendation"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus sm:w-auto"
            >
              Trouver un profil compatible
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-bold text-idfm-anthracite">Documents a prevoir</h2>
            <div className="mt-4">
              <RequiredDocumentList documents={currentOffer.requiredDocuments} />
            </div>
          </div>
          <div className="rounded-2xl border border-idfm-medium bg-idfm-light p-6">
            <h2 className="text-2xl font-bold text-idfm-anthracite">Comment l'obtenir ?</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-medium">
              Pour le MVP, la souscription prepare une demande suivie dans votre espace famille. Le paiement et l'envoi reel
              des justificatifs restent simules.
            </p>
            <Link
              href="/dashboard/family/subscriptions/new"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
            >
              Demarrer une demande
            </Link>
          </div>
        </section>

        {currentOffer.relatedOffers.length ? (
          <section>
            <h2 className="text-2xl font-bold text-idfm-anthracite">Offres proches</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentOffer.relatedOffers.map((relatedOffer) => (
                <OfferCard
                  key={relatedOffer.id}
                  offer={relatedOffer}
                  href={`/dashboard/family/titles/offers/${relatedOffer.slug}`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

export default function OfferDetailPage() {
  return (
    <Suspense fallback={<InfoBox>Chargement de l'offre...</InfoBox>}>
      <OfferDetailContent />
    </Suspense>
  );
}
