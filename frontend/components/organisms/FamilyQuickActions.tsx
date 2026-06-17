import Link from "next/link";
import { Button } from "../atoms/Button";
import { FoundPassCta } from "../molecules/FoundPassCta";
import { InfoBox } from "../molecules/InfoBox";
import { QuickActionCard } from "../molecules/QuickActionCard";
import type { DashboardMember } from "@/lib/api/types";

type FamilyQuickActionsProps = {
  members: DashboardMember[];
  onLostPassRequested: (memberId: string) => void;
};

export function FamilyQuickActions({
  members,
  onLostPassRequested,
}: FamilyQuickActionsProps) {
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
            href={`/dashboard/family/renewal/${youngMember.id}`}
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
        <InfoBox>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-idfm-anthracite">Declarer une carte perdue</p>
              <p className="mt-1 text-sm text-neutral-medium">
                Ouvrez le parcours puis choisissez le profil concerne pour lancer la demande.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => onLostPassRequested(youngMember?.id ?? members[0]?.id ?? "")}>
              Choisir le profil
            </Button>
          </div>
        </InfoBox>
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
