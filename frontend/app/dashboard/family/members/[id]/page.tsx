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
import { familyDashboardMock, getDemoMemberDetail } from "@/lib/demo/familyDashboardMock";
import type { MemberDetailResponse } from "@/lib/api/types";

function getStoredUserName() {
  if (typeof window === "undefined") {
    return familyDashboardMock.manager.firstName;
  }

  const storedUser = sessionStorage.getItem("familyUser");

  if (!storedUser) {
    return familyDashboardMock.manager.firstName;
  }

  try {
    const user = JSON.parse(storedUser) as { firstName?: string };
    return user.firstName ?? familyDashboardMock.manager.firstName;
  } catch {
    return familyDashboardMock.manager.firstName;
  }
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const memberId = typeof params.id === "string" ? params.id : "demo-lucas";
  const [detail, setDetail] = useState<MemberDetailResponse>(() => getDemoMemberDetail(memberId));
  const [flash, setFlash] = useState<{ message: string; tone: "green" | "orange" | "red" } | null>(null);
  const [isLostPassOpen, setIsLostPassOpen] = useState(false);
  const [isSubmittingLostPass, setIsSubmittingLostPass] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      return;
    }

    void getHouseholdMemberDetail(accessToken, memberId)
      .then((response) => {
        startTransition(() => setDetail(response));
      })
      .catch(() => {
        startTransition(() => setDetail(getDemoMemberDetail(memberId)));
      });
  }, [memberId]);

  async function handleLostPassSubmit(payload: { memberId: string; reason: string }) {
    const accessToken = localStorage.getItem("familyAccessToken");
    setIsSubmittingLostPass(true);

    let message = "Demande de remplacement creee en mode demo.";

    if (accessToken) {
      try {
        const response = await createLostPassSupportCase(accessToken, payload);
        message = response.message;
      } catch {
        message = "Demande de remplacement creee en mode demo.";
      }
    }

    startTransition(() => {
      setDetail((current) => ({
        ...current,
        member: {
          ...current.member,
          status: "LOST",
          nextAction: "Suivre la demande de remplacement",
        },
      }));
      setFlash({ message, tone: "green" });
      setIsLostPassOpen(false);
    });

    setIsSubmittingLostPass(false);
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
      userName={getStoredUserName()}
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
