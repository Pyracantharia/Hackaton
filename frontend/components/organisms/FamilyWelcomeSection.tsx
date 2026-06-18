import Image from "next/image";
import Link from "next/link";
import { Badge } from "../atoms/Badge";
import { QuickActionCard } from "../molecules/QuickActionCard";
import { StatusBadge } from "../molecules/StatusBadge";
import type { DashboardMember, HouseholdDashboardResponse, RegisterMemberType } from "@/lib/api/types";
import { getProfileVisual } from "@/lib/member-visuals";

type FamilyWelcomeSectionProps = {
  data: HouseholdDashboardResponse;
  onAddProfile: (profileType: RegisterMemberType) => void;
  onLostPassRequested: (memberId?: string) => void;
};

type PriorityAction = {
  badge: string;
  cta: string;
  description: string;
  href: string;
  member?: DashboardMember;
  title: string;
};

function getDisplayProduct(member: DashboardMember) {
  if (member.currentProduct) {
    return member.currentProduct;
  }

  if (member.recommendedProduct) {
    return member.recommendedProduct;
  }

  if (member.profileType === "YOUNG") {
    return "Offre jeune à choisir";
  }

  if (member.profileType === "SENIOR") {
    return "Offre senior à vérifier";
  }

  return "Aucun titre rattaché";
}

function getMemberActionHref(member: DashboardMember) {
  if (member.pendingRequest) {
    return `/dashboard/family/subscriptions/${member.pendingRequest.id}/confirmation`;
  }

  if (member.profileType === "YOUNG") {
    return `/dashboard/family/titles/recommendation?memberId=${member.id}`;
  }

  if (member.profileType === "SENIOR") {
    return `/dashboard/family/members/${member.id}`;
  }

  return "/dashboard/family/titles";
}

function buildPriorityAction(data: HouseholdDashboardResponse): PriorityAction {
  const youngMember = data.members.find((member) => member.profileType === "YOUNG");
  const seniorMember = data.members.find((member) => member.profileType === "SENIOR");
  const targetMember = youngMember ?? seniorMember ?? data.members.find((member) => member.profileType !== "MANAGER");

  if (!targetMember) {
    return {
      badge: "À faire",
      cta: "Ajouter un profil",
      description: "Ajoutez un enfant, un senior ou un proche pour préparer les démarches du foyer.",
      href: "/dashboard/family?tab=profiles",
      title: "Complétez votre foyer",
    };
  }

  if (targetMember.pendingRequest) {
    return {
      badge: "En cours",
      cta: "Voir l'état",
      description: "La demande est enregistrée. Vous pouvez suivre la vérification du dossier.",
      href: getMemberActionHref(targetMember),
      member: targetMember,
      title: `${targetMember.firstName} — demande ${targetMember.pendingRequest.offerName}`,
    };
  }

  if (targetMember.profileType === "SENIOR") {
    return {
      badge: "Conseillé",
      cta: "Vérifier l'offre",
      description: "Orientez ce profil vers Navigo Senior ou Améthyste avant de rattacher un titre.",
      href: getMemberActionHref(targetMember),
      member: targetMember,
      title: `${targetMember.firstName} peut vérifier une offre adaptée`,
    };
  }

  return {
    badge: "Prioritaire",
    cta: "Choisir une offre",
    description: "Comparez les offres jeune avant de lancer une souscription ou un rattachement.",
    href: getMemberActionHref(targetMember),
    member: targetMember,
    title: `${targetMember.firstName} peut choisir son forfait`,
  };
}

const welcomeActions = [
  {
    href: "/dashboard/family?tab=profiles",
    imageSrc: "/assets/logos/pictogrammes/family-pictogram.png",
    label: "Gérer mes profils",
  },
  {
    href: "/dashboard/family/titles",
    imageSrc: "/assets/logos/pictogrammes/weekly-pass-card.png",
    label: "Choisir un titre",
  },
  {
    href: "/dashboard/family?tab=demarches",
    imageSrc: "/assets/illustrations/hand-holding-ticket.png",
    label: "Suivre mes démarches",
  },
];

const helpQuestions = [
  "Comment fonctionne le compte famille ?",
  "Qui est porteur, qui est payeur ?",
  "Comment préparer une offre jeune ?",
  "Que faire en cas de perte de passe ?",
];

export function FamilyWelcomeSection({
  data,
  onAddProfile,
  onLostPassRequested,
}: FamilyWelcomeSectionProps) {
  const priorityAction = buildPriorityAction(data);
  const displayedMembers = data.members.slice(0, 3);
  const defaultLostMember = data.members.find((member) => member.profileType !== "MANAGER") ?? data.members[0];

  return (
    <section id="welcome" className="grid gap-8">
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <article className="rounded-3xl border border-idfm-medium bg-idfm-light p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone="blue">Compte Famille Navigo</Badge>
              <h2 className="mt-4 text-2xl font-bold text-idfm-anthracite sm:text-3xl">
                Bienvenue dans votre espace famille Navigo
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-medium sm:text-base">
                Retrouvez vos profils, vos titres et vos démarches importantes au même endroit.
              </p>
            </div>
            <Image
              src="/assets/illustrations/register-family.svg"
              alt=""
              width={220}
              height={160}
              className="hidden max-h-40 object-contain lg:block"
              priority
            />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {welcomeActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-idfm-anthracite shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-idfm-medium">
                  <Image src={action.imageSrc} alt="" width={40} height={40} className="h-9 w-9 object-contain" />
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="flex h-full flex-col justify-between rounded-3xl border border-status-warning bg-orange-50 p-6 shadow-sm sm:p-8">
          <div>
            <div className="flex items-start justify-between gap-3">
              <Badge tone="orange">{priorityAction.badge}</Badge>
              {priorityAction.member ? (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
                  <Image
                    src={getProfileVisual(priorityAction.member.profileType)}
                    alt=""
                    width={48}
                    height={48}
                    className="h-11 w-11 object-contain"
                  />
                </span>
              ) : null}
            </div>
            <h3 className="mt-5 text-xl font-bold text-idfm-anthracite">{priorityAction.title}</h3>
            <p className="mt-3 text-sm leading-6 text-neutral-medium">{priorityAction.description}</p>
          </div>
          <Link
            href={priorityAction.href}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-idfm-interaction px-5 text-sm font-semibold text-white transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
          >
            {priorityAction.cta}
          </Link>
        </article>
      </div>

      <section aria-labelledby="welcome-household-title" className="rounded-3xl border border-neutral-light bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="welcome-household-title" className="text-xl font-bold text-idfm-anthracite">Votre foyer</h3>
            <p className="mt-1 text-sm text-neutral-medium">Les profils suivis dans cet espace.</p>
          </div>
          <Link href="/dashboard/family?tab=profiles" className="text-sm font-bold text-idfm-interaction underline-offset-4 hover:underline">
            Voir tous les profils
          </Link>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {displayedMembers.map((member) => (
            <Link
              key={member.id}
              href={member.profileType === "MANAGER" ? "/dashboard/family?tab=profiles" : `/dashboard/family/members/${member.id}`}
              className="flex items-center gap-4 rounded-2xl border border-neutral-light bg-neutral-xlight p-4 transition hover:border-idfm-interaction hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
                <Image src={getProfileVisual(member.profileType)} alt="" width={48} height={48} className="h-11 w-11 object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-idfm-anthracite">
                  {member.firstName} {member.lastName}
                </span>
                <span className="mt-1 block truncate text-xs text-neutral-medium">{getDisplayProduct(member)}</span>
              </span>
              <StatusBadge status={member.status} />
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="welcome-actions-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="welcome-actions-title" className="text-2xl font-bold text-idfm-anthracite">Que souhaitez-vous faire ?</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-medium">Les raccourcis utiles pour avancer sans chercher.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickActionCard
            title="Souscrire ou rattacher"
            description="Trouvez l'offre adaptée pour un profil du foyer."
            href={priorityAction.href}
            imageSrc="/assets/logos/pictogrammes/generic-pass-card.png"
            trailing={<Badge tone="blue">Titre</Badge>}
          />
          <QuickActionCard
            title="Ajouter un profil"
            description="Ajoutez un enfant, un senior ou un proche."
            imageSrc="/assets/logos/pictogrammes/family-pictogram.png"
            onClick={() => onAddProfile("YOUNG")}
            trailing={<Badge tone="green">Actif</Badge>}
          />
          <QuickActionCard
            title="Carte perdue"
            description="Choisissez le profil concerné et lancez la demande."
            imageSrc="/assets/illustrations/printed-transit-ticket.png"
            onClick={() => onLostPassRequested(defaultLostMember?.id)}
            trailing={<Badge tone="orange">Démarche</Badge>}
          />
          <QuickActionCard
            title="Passe trouvé"
            description="Signalez un passe sans afficher de données personnelles."
            href="/found-pass"
            imageSrc="/assets/illustrations/hand-holding-ticket.png"
            trailing={<Badge tone="blue">Public</Badge>}
          />
        </div>
      </section>

      <section aria-labelledby="welcome-help-title" className="rounded-3xl border border-neutral-light bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 id="welcome-help-title" className="text-xl font-bold text-idfm-anthracite">Besoin d&apos;aide ?</h3>
            <p className="mt-1 text-sm text-neutral-medium">Les réponses courtes pour comprendre le compte famille.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {helpQuestions.map((question) => (
              <Link
                key={question}
                href="/dashboard/family?tab=help"
                className="rounded-xl bg-idfm-light px-4 py-3 text-sm font-semibold text-idfm-focus transition hover:bg-idfm-medium focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
              >
                {question}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
