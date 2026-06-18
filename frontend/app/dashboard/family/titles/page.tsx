"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { InfoBox } from "@/components/molecules/InfoBox";
import { OfferCard } from "@/components/molecules/OfferCard";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { getMyHouseholdDashboard } from "@/lib/api/households";
import { getTitleOffers } from "@/lib/api/titles";
import type { HouseholdDashboardResponse, ProductOffer } from "@/lib/api/types";
import { familyDashboardMock } from "@/lib/demo/familyDashboardMock";
import { titleOffersMock } from "@/lib/demo/titleOffersMock";
import { getMemberTitleAction } from "@/lib/member-title-actions";
import { getSubscriptionRequestStatusLabel } from "@/lib/subscription-status";

type TitlesPageState = {
  dashboard: HouseholdDashboardResponse;
  offers: ProductOffer[];
  isDemo: boolean;
};

function buildSummaryItems(data: HouseholdDashboardResponse) {
  const activeTitlesCount = data.members.filter((member) => getMemberTitleAction(member).status === "ACTIVE_TITLE").length;

  return [
    `Bonjour ${data.manager.firstName}`,
    `${data.summary.membersCount} profils suivis`,
    `${data.summary.offersToCheckCount} offre a etudier`,
    `${activeTitlesCount} titre actif`,
  ];
}

function formatMonthYear(value: string | null) {
  if (!value) {
    return "A definir";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function FamilyTitlesContent() {
  const [state, setState] = useState<TitlesPageState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    async function loadData() {
      try {
        const [dashboard, offers] = await Promise.all([
          accessToken ? getMyHouseholdDashboard(accessToken) : Promise.resolve(familyDashboardMock),
          getTitleOffers().catch(() => titleOffersMock),
        ]);

        setState({ dashboard, offers, isDemo: !accessToken });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Chargement impossible.");
        setState({ dashboard: familyDashboardMock, offers: titleOffersMock, isDemo: true });
      }
    }

    void loadData();
  }, []);

  const data = state?.dashboard ?? familyDashboardMock;
  const offers = state?.offers ?? titleOffersMock;
  const pendingMembers = data.members.filter((member) => member.pendingRequest);

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { label: "Titres" },
      ]}
      subtitle="Choisissez le bon titre pour chaque profil du foyer, sans creer d'abonnement automatique."
      summaryItems={buildSummaryItems(data)}
      title="Titres et offres Navigo"
      userName={state ? data.manager.firstName : "Mon espace"}
    >
      <div className="grid gap-10">
        {state?.isDemo || loadError ? (
          <InfoBox>
            {loadError ?? "Mode demo : les offres restent consultables meme sans session active."}
          </InfoBox>
        ) : null}

        <section className="grid gap-6 rounded-3xl border border-idfm-medium bg-idfm-light p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <Badge tone="blue">Assistant titres</Badge>
            <h2 className="mt-4 text-3xl font-bold text-idfm-anthracite">Trouver le bon titre pour un proche</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-medium">
              Selectionnez un profil, repondez a quelques questions, puis preparez une demande de souscription.
            </p>
          </div>
          <Link
            href="/dashboard/family/titles/recommendation"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
          >
            Trouver le bon titre
          </Link>
        </section>

        <section>
          {pendingMembers.length ? (
            <div className="mb-10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-idfm-anthracite">Demandes en attente</h2>
                  <p className="mt-1 text-sm text-neutral-medium">
                    Suivez les dossiers envoyés avant qu&apos;un titre soit rattaché au foyer.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {pendingMembers.map((member) => {
                  const request = member.pendingRequest;

                  if (!request) {
                    return null;
                  }

                  const actionHref =
                    request.status === "DRAFT"
                      ? `/dashboard/family/subscriptions/imagine-r/new?requestId=${request.id}`
                      : `/dashboard/family/subscriptions/${request.id}/confirmation`;
                  const actionLabel = request.status === "DRAFT" ? "Finaliser la demande" : "Voir l'état de ma demande";

                  return (
                    <article key={request.id} className="flex h-full flex-col rounded-2xl border border-status-warning bg-orange-50 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-idfm-anthracite">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="mt-1 text-sm text-neutral-medium">{request.offerName}</p>
                        </div>
                        <Badge tone="orange">{getSubscriptionRequestStatusLabel(request.status)}</Badge>
                      </div>
                      <p className="mt-4 flex-1 text-sm leading-6 text-neutral-medium">
                        Dossier {request.requestNumber ?? "enregistré"} : les informations et justificatifs peuvent être suivis depuis votre espace.
                      </p>
                      {request.renewal?.enabled ? (
                        <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm text-neutral-medium">
                          <p className="font-semibold text-idfm-anthracite">{request.renewal.label}</p>
                          <p className="mt-1">Prochaine échéance : {formatMonthYear(request.renewal.nextDate)}</p>
                          {request.renewal.canCancel ? (
                            <Link
                              href={`/dashboard/family/subscriptions/${request.id}/confirmation#renewal`}
                              className="mt-2 inline-flex font-semibold text-idfm-interaction underline-offset-4 hover:underline"
                            >
                              Gérer le renouvellement
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                      <Link
                        href={actionHref}
                        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
                      >
                        {actionLabel}
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-idfm-anthracite">Titres du foyer</h2>
              <p className="mt-1 text-sm text-neutral-medium">
                Aucun abonnement actif n&apos;est cree automatiquement. Chaque profil choisit d&apos;abord une offre.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {data.members.map((member) => {
              const action = getMemberTitleAction(member);

              return (
                <article key={member.id} className="flex h-full flex-col rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-idfm-anthracite">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-medium">{member.relationLabel}</p>
                    </div>
                    <Badge tone={action.statusTone}>{action.statusLabel}</Badge>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-6 text-neutral-medium">
                    {member.pendingRequest
                      ? `${member.pendingRequest.offerName} — ${getSubscriptionRequestStatusLabel(member.pendingRequest.status)}.`
                      : member.recommendedProduct
                        ? `Offre reperee : ${member.recommendedProduct}`
                        : "Aucun titre rattache pour le moment."}
                  </p>
                  {member.pendingRequest?.renewal?.enabled ? (
                    <p className="mt-3 rounded-xl bg-idfm-light px-3 py-2 text-sm font-semibold text-idfm-anthracite">
                      {member.pendingRequest.renewal.label}
                    </p>
                  ) : null}
                  <div className="mt-5 grid gap-3">
                    <Link
                      href={action.primaryHref}
                      className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
                    >
                      {action.primaryLabel}
                    </Link>
                    {action.secondaryLabel && action.secondaryHref ? (
                      <Link
                        href={action.secondaryHref}
                        className="inline-flex min-h-12 items-center justify-center rounded-md border border-idfm-interaction px-5 text-sm font-semibold text-idfm-interaction transition hover:bg-idfm-light focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
                      >
                        {action.secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-idfm-anthracite">Offres utiles</h2>
          <p className="mt-1 text-sm text-neutral-medium">
            Les principales offres du MVP, avec les documents a prevoir avant de demarrer.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} href={`/dashboard/family/titles/offers/${offer.slug}`} />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function FamilyTitlesPage() {
  return (
    <Suspense fallback={<InfoBox>Chargement des titres...</InfoBox>}>
      <FamilyTitlesContent />
    </Suspense>
  );
}
