import Link from "next/link";
import { Button } from "../atoms/Button";
import { FoundPassCta } from "../molecules/FoundPassCta";
import { QuickActionCard } from "../molecules/QuickActionCard";
import type { DashboardMember } from "@/lib/api/types";

type FamilyQuickActionsProps = {
  members: DashboardMember[];
};

export function FamilyQuickActions({ members }: FamilyQuickActionsProps) {
  const youngMember = members.find((member) => member.profileType === "YOUNG");

  return (
    <section id="services" className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-idfm-anthracite">Actions rapides</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">
            Retrouvez les actions utiles sans quitter la vue d&apos;ensemble.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {youngMember ? (
          <QuickActionCard
            title="Trouver une offre jeune"
            description="Comparer les offres adaptees au profil avant de rattacher un titre."
            href={`/dashboard/family/titles/recommendation?memberId=${youngMember.id}`}
            imageSrc="/assets/logos/pictogrammes/weekly-pass-card.png"
          />
        ) : null}
        <QuickActionCard
          title="J'ai trouve un passe"
          description="Un parcours public et neutre pour signaler un passe trouve sans exposer son proprietaire."
          href="/found-pass"
          imageSrc="/assets/illustrations/hand-holding-ticket.png"
        />
        <QuickActionCard
          title="Consulter mes profils"
          description="Retrouvez rapidement les profils, statuts et prochaines actions de votre foyer."
          href="/dashboard/family?tab=profiles"
          imageSrc="/assets/logos/pictogrammes/family-pictogram.png"
        />
      </div>

      <div className="mt-5">
        <FoundPassCta />
      </div>

      <div className="mt-5">
        <Link href="/dashboard/family?tab=help" className="contents">
          <Button type="button" variant="ghost">Contacter le support</Button>
        </Link>
      </div>
    </section>
  );
}
