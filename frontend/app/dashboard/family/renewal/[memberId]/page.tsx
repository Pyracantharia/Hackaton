"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { getHouseholdMemberDetail } from "@/lib/api/households";
import type { MemberDetailResponse } from "@/lib/api/types";

export default function RenewalPlaceholderPage() {
  const params = useParams<{ memberId: string }>();
  const memberId = typeof params.memberId === "string" ? params.memberId : "";
  const [detail, setDetail] = useState<MemberDetailResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");

    if (!accessToken) {
      queueMicrotask(() => {
        setLoadError("Connectez-vous pour charger ce parcours d'offre.");
      });
      return;
    }

    void getHouseholdMemberDetail(accessToken, memberId)
      .then((response) => startTransition(() => setDetail(response)))
      .catch((error: Error) => startTransition(() => setLoadError(error.message)));
  }, [memberId]);

  if (!detail) {
    return (
      <DashboardLayout
        activeTab="titles"
        breadcrumbs={[
          { href: "/", label: "Accueil" },
          { href: "/dashboard/family", label: "Mon foyer Navigo" },
          { label: "Choix d'offre" },
        ]}
        subtitle="Un parcours pour choisir une offre adaptee avant toute souscription."
        summaryItems={["Chargement du parcours"]}
        title="Choisir une offre"
        userName="Mon espace"
      >
        <InfoBox tone={loadError ? "orange" : "blue"}>{loadError ?? "Chargement du parcours..."}</InfoBox>
      </DashboardLayout>
    );
  }

  const member = detail.member;

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { label: "Choix d'offre" },
      ]}
      subtitle="Aucun titre n'est rattache automatiquement. Cette étape aide à choisir l'offre avant souscription."
      summaryItems={[member.firstName, "Aucun titre rattache"]}
      title={`Choisir une offre pour ${member.firstName}`}
      userName={detail.manager.firstName ?? "Mon espace"}
    >
      <div className="grid gap-6">
        <InfoBox tone="orange">
          Ce parcours est un placeholder crédible pour la démo. La souscription réelle, le paiement et l&apos;upload documentaire viendront ensuite.
        </InfoBox>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-idfm-interaction">Etape 1</p>
            <h2 className="mt-3 text-xl font-bold text-idfm-anthracite">Vérifier le profil</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Contrôlez les informations du profil avant de proposer une offre adaptée.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-idfm-interaction">Etape 2</p>
            <h2 className="mt-3 text-xl font-bold text-idfm-anthracite">Préparer les justificatifs</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Photo récente, certificat scolaire ou pièces complémentaires selon l'offre retenue.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-idfm-interaction">Etape 3</p>
            <h2 className="mt-3 text-xl font-bold text-idfm-anthracite">Lancer la souscription</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              La création du titre ne démarre qu'après validation explicite du dossier.
            </p>
          </article>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/family/members/${member.id}`} className="contents">
            <Button type="button">Voir le profil</Button>
          </Link>
          <Link href="/dashboard/family" className="contents">
            <Button type="button" variant="secondary">Retour au foyer</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
