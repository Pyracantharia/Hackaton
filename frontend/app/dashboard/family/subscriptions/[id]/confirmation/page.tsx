"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/atoms/Badge";
import { InfoBox } from "@/components/molecules/InfoBox";
import { RequiredDocumentList } from "@/components/molecules/RequiredDocumentList";
import { SubscriptionConfirmationTimeline } from "@/components/molecules/SubscriptionConfirmationTimeline";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { getSubscriptionRequest } from "@/lib/api/subscriptions";
import type { SubscriptionRequestResponse } from "@/lib/api/types";

function SubscriptionConfirmationContent() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<SubscriptionRequestResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setMessage("Connectez-vous pour afficher le suivi de cette demande.");
      setIsLoading(false);
      return;
    }

    void getSubscriptionRequest(accessToken, params.id)
      .then(setRequest)
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const userName = request?.payer.firstName ?? "Mon espace";

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
      summaryItems={request ? [request.offer.name, request.status, `Porteur : ${request.member.firstName}`] : ["Suivi de demande"]}
      title="Demande envoyee"
      userName={userName}
    >
      {isLoading ? <InfoBox>Chargement du suivi...</InfoBox> : null}
      {message ? <InfoBox>{message}</InfoBox> : null}

      {request ? (
        <div className="grid gap-8">
          <section className="rounded-3xl border border-status-success bg-white p-6 shadow-sm">
            <Badge tone="green">Demande creee</Badge>
            <h2 className="mt-4 text-3xl font-bold text-idfm-anthracite">{request.offer.name}</h2>
            <p className="mt-3 text-base leading-7 text-neutral-medium">
              La demande pour {request.member.firstName} {request.member.lastName} est prete a etre suivie. Aucun abonnement actif
              n'a ete cree automatiquement.
            </p>
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
                <p className="font-bold text-idfm-anthracite">{request.status}</p>
              </div>
            </div>
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
            <Link
              href="/dashboard/family"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
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
