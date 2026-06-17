"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { InfoBox } from "@/components/molecules/InfoBox";
import { SupportCaseTimeline } from "@/components/molecules/SupportCaseTimeline";
import { CancelSupportCaseModal } from "@/components/organisms/CancelSupportCaseModal";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { cancelSupportCase, getSupportCaseDetail } from "@/lib/api/households";
import type { SupportCaseDetail } from "@/lib/api/types";
import {
  finalChoiceLabels,
  formatSupportCaseDate,
  lostPassReasonLabels,
  resolutionLabels,
  supportCaseStatusLabels,
  supportCaseStatusTones,
} from "@/lib/supportCases";

export default function SupportCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const supportCaseId = typeof params.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<SupportCaseDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ message: string; tone: "green" | "orange" | "red" } | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      queueMicrotask(() => setLoadError("Connectez-vous pour suivre cette declaration."));
      return;
    }

    void getSupportCaseDetail(accessToken, supportCaseId)
      .then((response) => startTransition(() => setDetail(response)))
      .catch((error: Error) => startTransition(() => setLoadError(error.message)));
  }, [supportCaseId]);

  async function handleConfirmCancel() {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      setCancelError("Reconnectez-vous pour annuler la declaration.");
      return;
    }

    setIsCancelling(true);
    setCancelError("");

    try {
      const response = await cancelSupportCase(accessToken, supportCaseId);
      startTransition(() => {
        setDetail((current) =>
          current
            ? { ...current, status: response.supportCase.status, cancellable: false }
            : current,
        );
        setFlash({ message: response.message, tone: "green" });
        setIsCancelOpen(false);
      });
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : "La declaration n'a pas pu etre annulee.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  if (!detail) {
    return (
      <DashboardLayout
        activeTab="services"
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/dashboard/family?tab=services", label: "Mon foyer Navigo" },
          { label: "Suivi de declaration" },
        ]}
        showTabs={false}
        subtitle="Suivez l'avancement de votre declaration de perte."
        summaryItems={["Chargement de la declaration"]}
        title="Suivi SOS Navigo"
        userName="Mon espace"
      >
        <InfoBox tone={loadError ? "orange" : "blue"}>
          {loadError ?? "Chargement de la declaration..."}
        </InfoBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab="services"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family?tab=services", label: "Mon foyer Navigo" },
        { label: detail.dossierNumber },
      ]}
      showTabs={false}
      subtitle="Suivez l'avancement de votre declaration de perte et annulez si vous avez retrouve le pass."
      summaryItems={[detail.dossierNumber, supportCaseStatusLabels[detail.status]]}
      title="Suivi SOS Navigo"
      userName="Mon espace"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-6">
          {flash ? <InfoBox tone={flash.tone}>{flash.message}</InfoBox> : null}

          <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
                  {detail.dossierNumber}
                </p>
                <h2 className="mt-1 text-xl font-bold text-idfm-anthracite">
                  {detail.memberName ?? "Profil du foyer"}
                </h2>
              </div>
              <Badge tone={supportCaseStatusTones[detail.status]}>
                {supportCaseStatusLabels[detail.status]}
              </Badge>
            </div>

            <dl className="mt-5 grid gap-3 text-sm">
              {detail.titleLabel ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Titre concerne</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">{detail.titleLabel}</dd>
                </div>
              ) : null}
              {detail.passNumberMasked ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Numero de pass</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">{detail.passNumberMasked}</dd>
                </div>
              ) : null}
              {detail.reason ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Raison</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {lostPassReasonLabels[detail.reason]}
                  </dd>
                </div>
              ) : null}
              {detail.chosenResolution ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Option choisie</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {resolutionLabels[detail.chosenResolution]}
                  </dd>
                </div>
              ) : null}
              {detail.foundDeskName || detail.foundLocation ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Guichet de recuperation</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {detail.foundDeskName ?? detail.foundLocation}
                  </dd>
                </div>
              ) : null}
              {detail.foundDeskAddress ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Adresse guichet</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">{detail.foundDeskAddress}</dd>
                </div>
              ) : null}
              {detail.finalChoice ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-medium">Choix apres recuperation</dt>
                  <dd className="text-right font-semibold text-idfm-anthracite">
                    {finalChoiceLabels[detail.finalChoice]}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-medium">Date de creation</dt>
                <dd className="text-right font-semibold text-idfm-anthracite">
                  {formatSupportCaseDate(detail.createdAt)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-idfm-anthracite">Suivi de la demande</h2>
            <div className="mt-4">
              <SupportCaseTimeline chosenResolution={detail.chosenResolution} status={detail.status} />
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          {detail.cancellable ? (
            <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-idfm-anthracite">Vous avez retrouve le pass ?</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-medium">
                Vous pouvez annuler la declaration tant qu&apos;elle n&apos;a pas encore ete traitee par un agent.
              </p>
              <div className="mt-4">
                <Button type="button" variant="secondary" onClick={() => setIsCancelOpen(true)}>
                  Annuler ma declaration
                </Button>
              </div>
            </section>
          ) : detail.status === "PASS_FOUND_WAITING_PICKUP" ? (
            <InfoBox tone="green">
              Votre pass est disponible au guichet {detail.foundDeskName ?? detail.foundLocation ?? "indique"}.
              Utilisez le bandeau de votre tableau de bord pour confirmer la recuperation.
            </InfoBox>
          ) : (
            <InfoBox>
              Cette declaration ne peut plus etre annulee car elle a deja ete traitee ou annulee.
            </InfoBox>
          )}

          <section className="rounded-2xl bg-idfm-light p-5">
            <p className="text-sm leading-6 text-idfm-anthracite">
              Besoin d&apos;aide ? Notre support vous accompagne pour toute question sur votre declaration.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/dashboard/family?tab=services" className="contents">
                <Button type="button" className="w-full">Retour a mon espace</Button>
              </Link>
              <Link href="/dashboard/family?tab=help" className="contents">
                <Button type="button" variant="ghost" className="w-full">Contacter le support</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>

      <CancelSupportCaseModal
        dossierNumber={detail.dossierNumber}
        error={cancelError}
        isOpen={isCancelOpen}
        isSubmitting={isCancelling}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={() => void handleConfirmCancel()}
      />
    </DashboardLayout>
  );
}
