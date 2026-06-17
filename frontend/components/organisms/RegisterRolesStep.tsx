import { Badge } from "../atoms/Badge";
import { Checkbox } from "../atoms/Checkbox";
import { InfoBox } from "../molecules/InfoBox";
import { ProfileSummaryCard } from "../molecules/ProfileSummaryCard";
import type { ParentForm, RegisterMemberForm, RolesForm } from "../register/types";
import { departmentLabels, schoolLevelLabels, seniorRelationshipLabels } from "../register/types";
import { getProfileVisual } from "@/lib/member-visuals";

type RegisterRolesStepProps = {
  members: RegisterMemberForm[];
  onChange: (field: keyof RolesForm, value: boolean) => void;
  parent: ParentForm;
  roles: RolesForm;
};

function getAge(birthDate: string) {
  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return Number.isFinite(age) ? age : null;
}

export function RegisterRolesStep({ members, onChange, parent, roles }: RegisterRolesStepProps) {
  const youngMembers = members.filter((member) => member.type === "YOUNG");
  const minorMembers = youngMembers.filter((member) => {
    const age = getAge(member.birthDate);
    return age !== null && age < 18;
  });
  const parentName = `${parent.firstName || "Parent"} ${parent.lastName || ""}`.trim();

  return (
    <div className="grid gap-6">
      <InfoBox>
        Votre foyer est prêt à être configuré. Nous attribuons automatiquement les rôles utiles : le gestionnaire pilote
        les démarches, les profils ajoutés sont les porteurs des titres, et les paiements restent centralisés.
      </InfoBox>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-idfm-anthracite">Votre famille Navigo</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-medium">
              Voici comment les rôles seront préparés dans votre espace.
            </p>
          </div>
          <Badge tone="green">{members.length + 1} profil{members.length ? "s" : ""}</Badge>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProfileSummaryCard
            badges={["Gestionnaire", "Compte principal", "Payeur par défaut"]}
            description="Vous recevez les alertes importantes, suivez les dossiers et validez les prochaines démarches."
            icon={getProfileVisual("MANAGER")}
            name={parentName}
            subtitle="Pilote du foyer"
          />
          {members.map((member) => {
            const isYoung = member.type === "YOUNG";
            const detail = isYoung
              ? `${member.schoolLevel ? schoolLevelLabels[member.schoolLevel] : "Scolarité à préciser"} — ${departmentLabels[member.department]}`
              : `${departmentLabels[member.department]} — ${member.seniorRelationship ? seniorRelationshipLabels[member.seniorRelationship] : "Proche"}`;

            return (
              <ProfileSummaryCard
                key={member.id}
                badges={[isYoung ? "Enfant / jeune" : "Retraité / senior", "Porteur du titre"]}
                currentProduct={isYoung ? "Imagine R / Navigo Junior à recommander" : "Navigo Senior / Améthyste à vérifier"}
                description={detail}
                icon={getProfileVisual(member.type)}
                name={`${member.firstName} ${member.lastName}`.trim()}
                subtitle={isYoung ? "Profil scolaire" : "Profil accompagné"}
              />
            );
          })}
        </div>
      </section>

      {minorMembers.length ? (
        <Checkbox
          checked={roles.parentIsLegalRepresentative}
          description={`${minorMembers.map((member) => member.firstName).join(", ")} ${minorMembers.length > 1 ? "sont mineurs" : "est mineur"}. Cette confirmation permet de rattacher leur suivi au gestionnaire du foyer.`}
          label="Je confirme être responsable légal ou autorisé à gérer les démarches des mineurs ajoutés."
          name="parentIsLegalRepresentative"
          onChange={(event) => onChange("parentIsLegalRepresentative", event.target.checked)}
        />
      ) : (
        <InfoBox tone="green">
          Aucun mineur de moins de 18 ans n’a été détecté dans les profils ajoutés. Vous pourrez tout de même gérer les
          démarches du foyer depuis votre espace.
        </InfoBox>
      )}

      <InfoBox tone="orange">
        Les justificatifs, l’éligibilité Senior / Améthyste et les moyens de paiement seront demandés plus tard, au
        moment de la souscription ou du renouvellement. 
      </InfoBox>
    </div>
  );
}
