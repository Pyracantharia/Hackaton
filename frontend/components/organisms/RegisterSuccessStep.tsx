import Link from "next/link";
import { Button } from "../atoms/Button";
import { InfoBox } from "../molecules/InfoBox";
import { ProfileSummaryCard } from "../molecules/ProfileSummaryCard";
import type { RegisterResult } from "../register/types";
import { getProfileVisual } from "@/lib/member-visuals";

type RegisterSuccessStepProps = {
  result: RegisterResult;
};

export function RegisterSuccessStep({ result }: RegisterSuccessStepProps) {
  const parent = result.members.find((member) => member.relationship === "SELF");
  const householdMembers = result.members.filter((member) => member.relationship !== "SELF");

  return (
    <div className="grid gap-5">
      <InfoBox tone="green">
        Votre espace famille est prêt. Vous pouvez maintenant consulter le forfait recommandé et poursuivre la gestion des titres.
      </InfoBox>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileSummaryCard
          badges={["Compte principal", "Payeur"]}
          icon={getProfileVisual("MANAGER")}
          name={`${parent?.firstName ?? result.user.firstName} ${parent?.lastName ?? result.user.lastName}`}
          subtitle="Gestionnaire du foyer"
        />
        {householdMembers.map((member) => (
          <ProfileSummaryCard
            key={member.id}
            badges={[member.relationship === "CHILD" ? "Enfant / jeune" : "Proche accompagné", "Porteur"]}
            icon={getProfileVisual(member.relationship === "CHILD" ? "YOUNG" : "SENIOR")}
            name={`${member.firstName} ${member.lastName}`}
            subtitle={member.relationship === "CHILD" ? "Forfait à recommander" : "Offre à vérifier"}
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/family" className="contents">
          <Button>{result.nextAction.label}</Button>
        </Link>
        <Link href="/dashboard/family" className="contents">
          <Button variant="secondary">Accéder à mon espace famille</Button>
        </Link>
      </div>
    </div>
  );
}
