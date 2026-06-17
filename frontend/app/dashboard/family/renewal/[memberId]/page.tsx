"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InfoBox } from "@/components/molecules/InfoBox";
import { DashboardLayout } from "@/components/templates/DashboardLayout";

export default function RenewalCompatibilityPage() {
  const params = useParams<{ memberId: string }>();
  const router = useRouter();
  const memberId = typeof params.memberId === "string" ? params.memberId : "";
  const targetHref = `/dashboard/family/titles/recommendation?memberId=${memberId}`;

  useEffect(() => {
    router.replace(targetHref);
  }, [router, targetHref]);

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { label: "Redirection" },
      ]}
      subtitle="Le parcours de renouvellement passe maintenant par l'assistant titres."
      summaryItems={["Assistant titres"]}
      title="Ouverture de l'assistant"
      userName="Mon espace"
    >
      <div className="grid gap-4">
        <InfoBox>Redirection vers le nouvel assistant de recommandation...</InfoBox>
        <Link
          href={targetHref}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
        >
          Ouvrir l'assistant
        </Link>
      </div>
    </DashboardLayout>
  );
}
