"use client";

import Link from "next/link";
import { useEffect, useState, startTransition } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import { ProfileSummaryCard } from "@/components/molecules/ProfileSummaryCard";
import { StatusBadge } from "@/components/molecules/StatusBadge";
import { LostPassModal } from "@/components/organisms/LostPassModal";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import {
  createLostPassSupportCase,
  getHouseholdMemberDetail,
} from "@/lib/api/households";
import type { MemberDetailResponse } from "@/lib/api/types";
import { getProfileVisual } from "@/lib/member-visuals";

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const memberId = typeof params.id === "string" ? params.id : "";
  const [detail, setDetail] = useState<MemberDetailResponse | null>(null);
  const [flash, setFlash] = useState<{ message: string; tone: "green" | "orange" | "red" } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLostPassOpen, setIsLostPassOpen] = useState(false);
  const [isSubmittingLostPass, setIsSubmittingLostPass] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      queueMicrotask(() => {
        setLoadError("Connectez-vous pour charger ce profil.");
      });
      return;
    }

    void getHouseholdMemberDetail(accessToken, memberId)
      .then((response) => {
        startTransition(() => setDetail(response));
      })
      .catch((error: Error) => {
        startTransition(() => setLoadError(error.message));
      });
  }, [memberId]);

  async function handleLostPassSubmit(payload: { memberId: string; reason: string }) {
    const accessToken = localStorage.getItem("familyAccessToken");
    if (!detail || !accessToken) {
      setFlash({ message: "Impossible d'enregistrer la demande sans session active.", tone: "red" });
      return;
    }

    setIsSubmittingLostPass(true);

    let message = "Demande de remplacement creee.";

    try {
      const response = await createLostPassSupportCase(accessToken, payload);
      message = response.message;
    } catch {
      setFlash({ message: "La demande n'a pas pu etre enregistree pour le moment.", tone: "red" });
      setIsSubmittingLostPass(false);
      return;
    }

    startTransition(() => {
      setDetail((current) => (
        current
          ? {
              ...current,
              member: {
                ...current.member,
                status: "LOST",
                nextAction: "Suivre la demande de remplacement",
              },
            }
          : current
      ));
      setFlash({ message, tone: "green" });
      setIsLostPassOpen(false);
    });

    setIsSubmittingLostPass(false);
  }

  if (!detail) {
    return (
      <DashboardLayout
        activeTab="profiles"
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/dashboard/family", label: "Mon foyer Navigo" },
          { label: "Profil" },
        ]}
        subtitle="Detail du profil, informations utiles, documents attendus et prochaines actions."
        summaryItems={["Chargement du profil"]}
        title="Profil foyer"
        userName="Mon espace"
      >
        <InfoBox tone={loadError ? "orange" : "blue"}>{loadError ?? "Chargement du profil..."}</InfoBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab="profiles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { label: `${detail.member.firstName} ${detail.member.lastName}` },
      ]}
      subtitle="Detail du profil, informations utiles, documents attendus et prochaines actions."
      summaryItems={[
        detail.member.relationLabel,
        detail.member.currentProduct ?? detail.member.recommendedProduct ?? "Profil foyer",
      ]}
      title={`${detail.member.firstName} ${detail.member.lastName}`}
      userName={detail.manager.firstName ?? "Mon espace"}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          {flash ? <InfoBox tone={flash.tone}>{flash.message}</InfoBox> : null}

          <ProfileSummaryCard
            badges={[
              detail.member.profileType === "MANAGER"
                ? "Gestionnaire"
                : detail.member.profileType === "YOUNG"
                  ? "Enfant / jeune"
                  : "Retraitee / senior",
              detail.member.isPayer ? "Payeur" : "Accompagne",
            ]}
            currentProduct={detail.member.currentProduct ?? detail.member.recommendedProduct}
            description={detail.overview}
            icon={getProfileVisual(detail.member.profileType)}
            meta={[detail.supportNote]}
            name={`${detail.member.firstName} ${detail.member.lastName}`}
            status={<StatusBadge status={detail.member.status} />}
            subtitle={detail.householdRole}
          />

          <section id="documents" className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-idfm-anthracite">Documents et preparation</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Les elements a preparer sont affiches ici pour faciliter le suivi du dossier.
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-neutral-medium">
              {detail.documents.map((document) => (
                <li key={document} className="rounded-xl bg-neutral-xlight px-4 py-3">
                  {document}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-idfm-anthracite">Actions utiles</h2>
            <div className="mt-5 grid gap-3">
              {detail.actions.map((action) => (
                action.href ? (
                  <Link key={`${action.label}-${action.href}`} href={action.href} className="contents">
                    <Button type="button" variant={action.variant}>{action.label}</Button>
                  </Link>
                ) : (
                  <Button
                    key={action.label}
                    type="button"
                    variant={action.variant}
                    onClick={() => setIsLostPassOpen(true)}
                  >
                    {action.label}
                  </Button>
                )
              ))}
            </div>
          </section>

          {detail.accessibilityNote ? (
            <InfoBox>{detail.accessibilityNote}</InfoBox>
          ) : null}

          <section id="eligibilite" className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-idfm-anthracite">Alertes du profil</h2>
            <div className="mt-4 grid gap-3">
              {detail.alerts.map((alert) => (
                <InfoBox key={alert.id} tone={alert.severity === "WARNING" ? "orange" : "blue"}>
                  <span className="font-semibold text-idfm-anthracite">{alert.title}</span>
                  <span className="mt-1 block text-neutral-medium">{alert.message}</span>
                </InfoBox>
              ))}
            </div>
          </section>
        </div>
      </div>

      {isLostPassOpen ? (
        <LostPassModal
          defaultMemberId={detail.member.id}
          isOpen={isLostPassOpen}
          isSubmitting={isSubmittingLostPass}
          members={[detail.member]}
          onClose={() => setIsLostPassOpen(false)}
          onSubmit={handleLostPassSubmit}
        />
      ) : null}
    </DashboardLayout>
  );
}
