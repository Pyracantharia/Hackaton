"use client";

import Link from "next/link";
import { Suspense, startTransition, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import { RequiredDocumentList } from "@/components/molecules/RequiredDocumentList";
import { SubscriptionConfirmationTimeline } from "@/components/molecules/SubscriptionConfirmationTimeline";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { cancelSubscriptionRenewal, getSubscriptionRequest } from "@/lib/api/subscriptions";
import type { SubscriptionRequestResponse } from "@/lib/api/types";
import { getSubscriptionRequestStatusLabel } from "@/lib/subscription-status";

const monthLabels = [
  "",
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const emptyRenewal = {
  enabled: false,
  type: null,
  status: "DISABLED",
  months: null,
  monthsRemaining: null,
  nextDate: null,
  activatedAt: null,
  cancelledAt: null,
  label: "Aucun renouvellement automatique activé",
  canCancel: false,
} satisfies SubscriptionRequestResponse["renewal"];

function formatMonthYear(value: string | null) {
  if (!value) return "échéance à confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "échéance à confirmer";
  return `${monthLabels[date.getMonth() + 1]} ${date.getFullYear()}`;
}

function SubscriptionConfirmationContent() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<SubscriptionRequestResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancellingRenewal, setIsCancellingRenewal] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      void Promise.resolve().then(() => {
        setMessage("Connectez-vous pour afficher le suivi de cette demande.");
        setIsLoading(false);
      });
      return;
    }

    void getSubscriptionRequest(accessToken, params.id)
      .then(setRequest)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const userName = request?.payer.firstName ?? "Mon espace";
  const renewal = request?.renewal ?? emptyRenewal;

  async function handleCancelRenewal() {
    if (!request) return;
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setMessage("Connectez-vous pour modifier le renouvellement.");
      return;
    }

    setIsCancellingRenewal(true);
    setMessage(null);

    try {
      const updated = await cancelSubscriptionRenewal(accessToken, request.id);
      setRequest(updated);
      setMessage("Le renouvellement automatique a bien été désactivé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de modifier le renouvellement.");
    } finally {
      setIsCancellingRenewal(false);
    }
  }
  const isDraft = request?.status === "DRAFT";
  const requestStatusLabel = request ? getSubscriptionRequestStatusLabel(request.status) : "";

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { href: "/dashboard/family/titles", label: "Titres" },
        { label: "Confirmation" },
      ]}
      subtitle="Votre demande est enregistree et suivie dans l'espace famille."
      summaryItems={request ? [request.offer.name, requestStatusLabel, `Porteur : ${request.member.firstName}`] : ["Suivi de demande"]}
      title="Demande envoyee"
      userName={userName}
    >
      {isLoading ? <InfoBox>Chargement du suivi...</InfoBox> : null}
      {message ? <InfoBox>{message}</InfoBox> : null}

      {request ? (
        <div className="grid gap-8">
          <section className="rounded-3xl border border-status-success bg-white p-6 shadow-sm">
            <Badge tone={request.status === "REJECTED" ? "red" : request.status === "BLOCKED" ? "orange" : "green"}>
              {request.status === "REJECTED" ? "Demande refusée" : request.status === "BLOCKED" ? "Correction nécessaire" : "Demande creee"}
            </Badge>
            <h2 className="mt-4 text-3xl font-bold text-idfm-anthracite">{request.offer.name}</h2>
            <p className="mt-3 text-base leading-7 text-neutral-medium">
              {request.status === "ACTIVE"
                ? `La demande pour ${request.member.firstName} ${request.member.lastName} est validée. Le titre est actif dans votre espace famille.`
                : request.status === "REJECTED"
                  ? `La demande pour ${request.member.firstName} ${request.member.lastName} a été refusée par nos équipes.`
                  : request.status === "BLOCKED"
                    ? `La demande pour ${request.member.firstName} ${request.member.lastName} nécessite une correction avant de pouvoir continuer.`
                    : `La demande pour ${request.member.firstName} ${request.member.lastName} est prete a etre suivie. Aucun abonnement actif n'a ete cree automatiquement.`}
            </p>
            {request.rejectionReason ? (
              <InfoBox className="mt-4" tone={request.status === "REJECTED" ? "red" : "orange"}>
                Motif : {request.rejectionReason}
              </InfoBox>
            ) : null}
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-neutral-medium">Porteur</p>
                <p className="font-bold text-idfm-anthracite">{request.member.firstName} {request.member.lastName}</p>
              </div>
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-neutral-medium">Payeur</p>
                <p className="font-bold text-idfm-anthracite">{request.payer.firstName} {request.payer.lastName}</p>
              </div>
              <div className="rounded-2xl bg-idfm-light p-4">
                <p className="text-neutral-medium">Statut</p>
                <p className="font-bold text-idfm-anthracite">{requestStatusLabel}</p>
              </div>
            </div>
          </section>

          <section id="renewal" className="rounded-3xl border border-neutral-light bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={renewal.enabled ? "green" : "orange"}>
                {renewal.enabled ? "Activé" : renewal.status === "CANCELLED" ? "Désactivé" : "Non activé"}
              </Badge>
              <Badge tone="blue">
                {renewal.type === "MONTHLY"
                  ? "Reconduction mensuelle"
                  : renewal.type === "ANNUAL"
                    ? "Renouvellement annuel"
                    : "Option disponible"}
              </Badge>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-idfm-anthracite">Gérer le renouvellement</h2>
            {renewal.enabled ? (
              <>
                <p className="mt-3 text-sm leading-6 text-neutral-medium">
                  {renewal.label}. Prochaine échéance : {formatMonthYear(renewal.nextDate)}.
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-medium">
                  Votre titre actuel reste valable jusqu&apos;à sa fin. Vous pouvez annuler avant la prochaine échéance.
                </p>
                {renewal.type === "ANNUAL" ? (
                  <InfoBox className="mt-4">
                    Certains justificatifs pourront être redemandés chaque année si votre situation l&apos;exige, sans refaire tout le parcours.
                  </InfoBox>
                ) : null}
                <div className="mt-5">
                  <Button type="button" variant="secondary" onClick={handleCancelRenewal} disabled={isCancellingRenewal}>
                    {isCancellingRenewal
                      ? "Annulation..."
                      : renewal.type === "MONTHLY"
                        ? "Annuler la reconduction"
                        : "Annuler le renouvellement automatique"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-neutral-medium">
                {renewal.label}. Vous pourrez le réactiver plus tard depuis votre espace famille.
              </p>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1fr]">
            <div>
              <h2 className="text-2xl font-bold text-idfm-anthracite">Suivi</h2>
              <div className="mt-4">
                <SubscriptionConfirmationTimeline timeline={request.timeline} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-idfm-anthracite">Justificatifs</h2>
              <div className="mt-4">
                <RequiredDocumentList documents={request.documents} />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            {isDraft ? (
              <Link
                href={`/dashboard/family/subscriptions/imagine-r/new?requestId=${request.id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
              >
                Finaliser la demande
              </Link>
            ) : null}
            <Link
              href="/dashboard/family"
              className={`inline-flex min-h-12 items-center justify-center rounded-md px-5 text-sm font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus ${
                isDraft
                  ? "border border-idfm-interaction bg-white text-idfm-interaction hover:bg-idfm-light"
                  : "bg-idfm-interaction text-white hover:bg-idfm-focus"
              }`}
            >
              Retour a mon foyer
            </Link>
            <Link
              href={`/dashboard/family/members/${request.member.id}`}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-idfm-interaction bg-white px-5 text-sm font-semibold text-idfm-interaction transition hover:bg-idfm-light focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
            >
              Voir le profil
            </Link>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default function SubscriptionConfirmationPage() {
  return (
    <Suspense fallback={<InfoBox>Chargement de la confirmation...</InfoBox>}>
      <SubscriptionConfirmationContent />
    </Suspense>
  );
}
