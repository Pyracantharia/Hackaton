"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { familyDashboardMock } from "@/lib/demo/familyDashboardMock";

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

export default function RenewalPlaceholderPage() {
  const params = useParams<{ memberId: string }>();
  const memberId = typeof params.memberId === "string" ? params.memberId : "demo-lucas";
  const member = familyDashboardMock.members.find((candidate) => candidate.id === memberId) ?? familyDashboardMock.members[1];

  return (
    <DashboardLayout
      activeTab="titles"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { href: "/dashboard/family", label: "Mon foyer Navigo" },
        { label: "Renouvellement" },
      ]}
      subtitle="Un parcours de renouvellement simple, anticipe pour la rentree et prepare les justificatifs utiles."
      summaryItems={[member.firstName, member.currentProduct ?? "Titre a renouveler"]}
      title={`Renouvellement de ${member.firstName}`}
      userName={getStoredUserName()}
    >
      <div className="grid gap-6">
        <InfoBox tone="orange">
          Ce parcours est un placeholder credibile pour la demo. La logique complete de paiement et d&apos;upload documentaire viendra ensuite.
        </InfoBox>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-idfm-interaction">Etape 1</p>
            <h2 className="mt-3 text-xl font-bold text-idfm-anthracite">Verifier le profil</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Controlez les informations du porteur, la photo et le lien payeur / porteur.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-idfm-interaction">Etape 2</p>
            <h2 className="mt-3 text-xl font-bold text-idfm-anthracite">Preparer les justificatifs</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Photo recente, certificat scolaire et pieces complementaires selon le dossier.
            </p>
          </article>

          <article className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-idfm-interaction">Etape 3</p>
            <h2 className="mt-3 text-xl font-bold text-idfm-anthracite">Valider la demande</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">
              Confirmation du dossier, suivi des delais et relances utiles avant la rentree.
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
