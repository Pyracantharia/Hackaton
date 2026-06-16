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
  const child = result.members.find((member) => member.relationship === "CHILD");

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
        <ProfileSummaryCard
          badges={["Profil enfant", "Porteur"]}
          icon={getProfileVisual("YOUNG")}
          name={`${child?.firstName ?? "Lucas"} ${child?.lastName ?? "Martin"}`}
          subtitle="Forfait à recommander"
        />
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
