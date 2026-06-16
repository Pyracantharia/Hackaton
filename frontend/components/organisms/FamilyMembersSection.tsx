import Link from "next/link";
import { Button } from "../atoms/Button";
import { ProfileSummaryCard } from "../molecules/ProfileSummaryCard";
import { StatusBadge } from "../molecules/StatusBadge";
import type { DashboardMember } from "@/lib/api/types";

type FamilyMembersSectionProps = {
  cardsId?: string;
  members: DashboardMember[];
  sectionId?: string;
  title?: string;
  description?: string;
};

function getMemberBadges(member: DashboardMember) {
  const baseBadge =
    member.profileType === "MANAGER"
      ? "Gestionnaire"
      : member.profileType === "YOUNG"
        ? "Enfant / jeune"
        : member.profileType === "SENIOR"
          ? "Retraitee / senior"
          : "Profil";

  const badges = [baseBadge];

  if (member.isPayer) {
    badges.push("Payeur");
  }

  if (member.isHolder) {
    badges.push("Porteur");
  }

  return badges;
}

function getPrimaryAction(member: DashboardMember) {
  if (member.profileType === "YOUNG") {
    return `/dashboard/family/renewal/${member.id}`;
  }

  if (member.profileType === "SENIOR") {
    return `/dashboard/family/members/${member.id}`;
  }

  return "/dashboard/family?tab=titles";
}

function getPrimaryLabel(member: DashboardMember) {
  if (member.profileType === "YOUNG") {
    return "Renouveler";
  }

  if (member.profileType === "SENIOR") {
    return "Verifier l'offre";
  }

  return "Voir mon titre";
}

function getSecondaryLabel(member: DashboardMember) {
  if (member.profileType === "YOUNG") {
    return "Voir le dossier";
  }

  if (member.profileType === "SENIOR") {
    return "Voir le profil";
  }

  return "Attestation employeur";
}

function getSecondaryHref(member: DashboardMember) {
  if (member.profileType === "MANAGER") {
    return "/dashboard/family";
  }

  return `/dashboard/family/members/${member.id}`;
}

export function FamilyMembersSection({
  cardsId = "titles",
  members,
  sectionId = "profiles",
  title = "Profils du foyer",
  description = "Chaque profil dispose de son titre, de son statut et de sa prochaine action.",
}: FamilyMembersSectionProps) {
  return (
    <section id={sectionId} className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-idfm-anthracite">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">
            {description}
          </p>
        </div>
      </div>

      <div id={cardsId} className="mt-6 grid gap-5 xl:grid-cols-3">
        {members.map((member) => (
          <ProfileSummaryCard
            key={member.id}
            badges={getMemberBadges(member)}
            currentProduct={member.currentProduct ?? member.recommendedProduct}
            description={member.nextAction}
            meta={[
              member.payerName ? `Payeur : ${member.payerName}` : "Payeur a definir",
              member.relationLabel,
            ]}
            name={`${member.firstName} ${member.lastName}`}
            status={<StatusBadge status={member.status} />}
            subtitle={member.relationLabel}
            actions={(
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href={getPrimaryAction(member)} className="contents">
                  <Button type="button">{getPrimaryLabel(member)}</Button>
                </Link>
                <Link href={getSecondaryHref(member)} className="contents">
                  <Button type="button" variant="secondary">{getSecondaryLabel(member)}</Button>
                </Link>
              </div>
            )}
          />
        ))}
      </div>
    </section>
  );
}
