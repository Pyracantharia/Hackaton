"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { InfoBox } from "@/components/molecules/InfoBox";
import { ProfilePickerCard } from "@/components/molecules/ProfilePickerCard";
import { RequiredDocumentList } from "@/components/molecules/RequiredDocumentList";
import { SmartDossierCard } from "@/components/molecules/SmartDossierCard";
import { SubscriptionStepper } from "@/components/molecules/SubscriptionStepper";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { getMyHouseholdDashboard } from "@/lib/api/households";
import { createSubscriptionRequest } from "@/lib/api/subscriptions";
import { getTitleOffers } from "@/lib/api/titles";
import type { DashboardMember, HouseholdDashboardResponse, ProductOffer } from "@/lib/api/types";
import { familyDashboardMock } from "@/lib/demo/familyDashboardMock";
import { titleOffersMock } from "@/lib/demo/titleOffersMock";
import { getMemberTitleAction } from "@/lib/member-title-actions";

const steps = ["Porteur", "Offre", "Dossier", "Confirmation"];

function isImagineROffer(offer: ProductOffer | undefined) {
  return offer?.productType === "IMAGINE_R_JUNIOR" || offer?.productType === "IMAGINE_R_SCHOOL";
}

function preferredOfferForMember(member: DashboardMember | undefined, offers: ProductOffer[]) {
  if (!member) {
    return offers[0];
  }

  if (member.profileType === "YOUNG") {
    return offers.find((offer) => offer.slug === "imagine-r-scolaire") ?? offers[0];
  }

  if (member.profileType === "SENIOR") {
    return offers.find((offer) => offer.slug === "navigo-senior") ?? offers[0];
  }

  return offers.find((offer) => offer.slug === "navigo-annuel") ?? offers[0];
}

function SubscriptionNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<HouseholdDashboardResponse | null>(null);
  const [offers, setOffers] = useState<ProductOffer[]>(titleOffersMock);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(searchParams.get("memberId"));
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(searchParams.get("offerId"));
  const [payerMemberId, setPayerMemberId] = useState<string | null>(null);
  const [intelligentDossierEnabled, setIntelligentDossierEnabled] = useState(true);
  const [autoRenewalEnabled, setAutoRenewalEnabled] = useState(false);
  const [renewalMonths, setRenewalMonths] = useState(3);
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    async function loadData() {
      try {
        const [dashboardResponse, offersResponse] = await Promise.all([
          accessToken ? getMyHouseholdDashboard(accessToken) : Promise.resolve(familyDashboardMock),
          getTitleOffers().catch(() => titleOffersMock),
        ]);

        setDashboard(dashboardResponse);
        setOffers(offersResponse);
        setSelectedMemberId((current) => current ?? dashboardResponse.members[0]?.id ?? null);
        setPayerMemberId(dashboardResponse.manager.id);
        setSelectedOfferId((current) => current ?? preferredOfferForMember(dashboardResponse.members[0], offersResponse)?.id ?? null);
      } catch (error) {
        setDashboard(familyDashboardMock);
        setOffers(titleOffersMock);
        setPayerMemberId(familyDashboardMock.manager.id);
        setMessage(error instanceof Error ? error.message : "Mode demo active.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [searchParams]);

  const data = dashboard ?? familyDashboardMock;
  const selectedMember = useMemo(
    () => data.members.find((member) => member.id === selectedMemberId) ?? data.members[0],
    [data.members, selectedMemberId],
  );
  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) ?? preferredOfferForMember(selectedMember, offers),
    [offers, selectedMember, selectedOfferId],
  );
  const selectedMemberAction = selectedMember ? getMemberTitleAction(selectedMember) : null;
  const payerMember = data.members.find((member) => member.id === payerMemberId) ?? data.members.find((member) => member.id === data.manager.id);
  const isMonthlyOffer = selectedOffer?.productType === "NAVIGO_LIBERTE";

  useEffect(() => {
    if (
      isLoading ||
      !selectedMember ||
      !selectedOffer ||
      !isImagineROffer(selectedOffer) ||
      (selectedMemberAction && !selectedMemberAction.canStartSubscription)
    ) {
      return;
    }

    router.replace(`/dashboard/family/subscriptions/imagine-r/new?memberId=${selectedMember.id}&offerId=${selectedOffer.id}`);
  }, [isLoading, router, selectedMember, selectedMemberAction, selectedOffer]);

  function handleNext() {
    if (step === 0 && selectedMemberAction && !selectedMemberAction.canStartSubscription) {
      setMessage(selectedMemberAction.message);
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function handleConfirm() {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setMessage("Connectez-vous pour enregistrer une vraie demande de souscription.");
      return;
    }

    if (!selectedMember || !selectedOffer) {
      setMessage("Choisissez un porteur et une offre.");
      return;
    }

    if (selectedMemberAction && !selectedMemberAction.canStartSubscription) {
      setMessage(selectedMemberAction.message);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const request = await createSubscriptionRequest(accessToken, {
        householdMemberId: selectedMember.id,
        offerId: selectedOffer.id,
        payerMemberId: payerMember?.id,
        intelligentDossierEnabled,
        autoRenewalEnabled,
        renewalMonths: autoRenewalEnabled && isMonthlyOffer ? renewalMonths : undefined,
      });
      router.push(`/dashboard/family/subscriptions/${request.id}/confirmation`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de creer la demande.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout
        activeTab="titles"
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/dashboard/family/titles", label: "Titres" },
          { label: "Souscription" },
        ]}
        subtitle="Preparation de la demande."
        summaryItems={["Chargement"]}
        title="Nouvelle demande"
        userName="Mon espace"
      >
        <InfoBox>Chargement du parcours...</InfoBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { href: "/dashboard/family/titles", label: "Titres" },
        { label: "Souscription" },
      ]}
      subtitle="Preparez une demande suivie dans l'espace famille. Aucun titre actif n'est cree a cette etape."
      summaryItems={[`Porteur : ${selectedMember?.firstName ?? "a choisir"}`, selectedOffer?.name ?? "Offre a choisir"]}
      title="Demande de souscription"
      userName={data.manager.firstName}
    >
      <div className="grid gap-8">
        {message ? <InfoBox>{message}</InfoBox> : null}
        {selectedMemberAction && !selectedMemberAction.canStartSubscription ? (
          <InfoBox>
            {selectedMemberAction.message}{" "}
            <Link href={selectedMemberAction.primaryHref} className="font-semibold text-idfm-interaction underline-offset-4 hover:underline">
              {selectedMemberAction.primaryLabel}
            </Link>
          </InfoBox>
        ) : null}

        <div className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
          <SubscriptionStepper currentStep={step} steps={steps} />
        </div>

        {step === 0 ? (
          <section>
            <h2 className="text-2xl font-bold text-idfm-anthracite">Qui portera le titre ?</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.members.map((member) => (
                <ProfilePickerCard
                  key={member.id}
                  isSelected={member.id === selectedMember?.id}
                  member={member}
                  onSelect={() => {
                    setSelectedMemberId(member.id);
                    const offer = preferredOfferForMember(member, offers);
                    setSelectedOfferId(offer?.id ?? null);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <h2 className="text-2xl font-bold text-idfm-anthracite">Quelle offre ?</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setSelectedOfferId(offer.id)}
                  className={`flex h-full flex-col rounded-2xl border p-5 text-left shadow-sm transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus ${
                    offer.id === selectedOffer?.id ? "border-idfm-interaction bg-idfm-light" : "border-neutral-light bg-white hover:border-idfm-medium"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-idfm-anthracite">{offer.name}</h3>
                    {offer.id === selectedOffer?.id ? <Badge tone="blue">Choisie</Badge> : null}
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-6 text-neutral-medium">{offer.shortDescription}</p>
                  <p className="mt-4 font-bold text-idfm-anthracite">{offer.priceLabel}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 2 && selectedOffer ? (
          <section className="grid gap-6 lg:grid-cols-[0.85fr_1fr]">
            <SmartDossierCard checked={intelligentDossierEnabled} onChange={setIntelligentDossierEnabled} />
            <div>
              <h2 className="text-2xl font-bold text-idfm-anthracite">Justificatifs attendus</h2>
              <p className="mt-1 text-sm text-neutral-medium">Ils sont prepares dans la demande, sans upload reel pour le MVP.</p>
              <div className="mt-4">
                <RequiredDocumentList documents={selectedOffer.requiredDocuments} />
              </div>
            </div>
          </section>
        ) : null}

        {step === 3 && selectedMember && selectedOffer ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-neutral-light bg-white p-6 shadow-sm">
              <Badge tone="blue">Recapitulatif</Badge>
              <h2 className="mt-4 text-2xl font-bold text-idfm-anthracite">{selectedOffer.name}</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Porteur</dt>
                  <dd className="font-semibold text-idfm-anthracite">{selectedMember.firstName} {selectedMember.lastName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Payeur</dt>
                  <dd className="font-semibold text-idfm-anthracite">{payerMember?.firstName ?? data.manager.firstName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Statut cree</dt>
                  <dd className="font-semibold text-idfm-anthracite">Demande de souscription</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border border-idfm-medium bg-idfm-light p-6">
              <h2 className="text-xl font-bold text-idfm-anthracite">Options de suivi</h2>
              <div className="mt-4 grid gap-3">
                <Checkbox
                  checked={autoRenewalEnabled}
                  label={isMonthlyOffer ? "Activer la reconduction mensuelle" : "Activer le renouvellement automatique"}
                  description={
                    isMonthlyOffer
                      ? "Votre titre sera reconduit pendant la durée choisie, sans paiement réel dans le MVP."
                      : "Vous recevrez un rappel avant la prochaine échéance et pourrez annuler depuis votre espace."
                  }
                  onChange={(event) => setAutoRenewalEnabled(event.target.checked)}
                />
                {autoRenewalEnabled && isMonthlyOffer ? (
                  <label className="rounded-md border border-neutral-light bg-white p-4 text-xs font-bold uppercase tracking-wide text-neutral-medium">
                    Durée de reconduction
                    <select
                      value={renewalMonths}
                      onChange={(event) => setRenewalMonths(Number(event.target.value))}
                      className="mt-2 min-h-12 w-full rounded-md border border-neutral-medium bg-white px-4 text-base normal-case text-idfm-anthracite focus:border-idfm-focus focus:ring-3 focus:ring-idfm-medium"
                    >
                      {[1, 2, 3, 6, 12].map((months) => (
                        <option key={months} value={months}>
                          {months} mois
                        </option>
                      ))}
                    </select>
                    <span className="mt-2 block text-sm font-normal normal-case leading-6 text-neutral-medium">
                      Reconduction annulable avant la prochaine échéance.
                    </span>
                  </label>
                ) : null}
                {autoRenewalEnabled && !isMonthlyOffer ? (
                  <InfoBox>
                    Annulable avant échéance. Des justificatifs pourront être redemandés si votre situation l'exige,
                    sans refaire toute la souscription.
                  </InfoBox>
                ) : null}
                <Checkbox
                  checked={intelligentDossierEnabled}
                  label="Conserver le dossier intelligent"
                  description="Les justificatifs restent visibles dans le suivi."
                  onChange={(event) => setIntelligentDossierEnabled(event.target.checked)}
                />
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {step === 0 ? (
            <Link href="/dashboard/family/titles" className="text-sm font-semibold text-idfm-interaction hover:underline">
              Retour aux titres
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              className="text-sm font-semibold text-idfm-interaction hover:underline"
            >
              Retour
            </button>
          )}

          {step < steps.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Continuer
            </Button>
          ) : (
            <Button type="button" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Creation..." : "Confirmer la demande"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SubscriptionNewPage() {
  return (
    <Suspense fallback={<InfoBox>Chargement de la souscription...</InfoBox>}>
      <SubscriptionNewContent />
    </Suspense>
  );
}
