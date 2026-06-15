import { Checkbox } from "../atoms/Checkbox";
import { InfoBox } from "../molecules/InfoBox";
import { ProfileSummaryCard } from "../molecules/ProfileSummaryCard";
import type { ChildForm, ParentForm, RolesForm } from "../register/types";

type RegisterRolesStepProps = {
  child: ChildForm;
  onChange: (field: keyof RolesForm, value: boolean) => void;
  parent: ParentForm;
  roles: RolesForm;
};

export function RegisterRolesStep({ child, onChange, parent, roles }: RegisterRolesStepProps) {
  return (
    <div className="grid gap-5">
      <InfoBox>
        Le porteur est la personne qui utilise le titre. Le payeur règle l&apos;abonnement. Ici, votre enfant sera le porteur et vous pourrez être le payeur.
      </InfoBox>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileSummaryCard
          badges={["Compte principal", "Gestionnaire", roles.parentIsPayer ? "Payeur" : "Non payeur"]}
          name={`${parent.firstName || "Parent"} ${parent.lastName || ""}`.trim()}
          subtitle="Parent"
        />
        <ProfileSummaryCard
          badges={["Profil enfant", "Porteur"]}
          name={`${child.firstName || "Enfant"} ${child.lastName || ""}`.trim()}
          subtitle="Titre de transport"
        />
      </div>
      <Checkbox
        checked={roles.parentIsLegalRepresentative}
        description="Cette confirmation permet de rattacher le profil enfant à votre espace famille."
        label="Je suis le responsable légal de cet enfant."
        name="parentIsLegalRepresentative"
        onChange={(event) => onChange("parentIsLegalRepresentative", event.target.checked)}
      />
      <Checkbox
        checked={roles.parentIsPayer}
        description="Vous pourrez gérer les paiements et renouvellements depuis votre espace."
        label="Je serai le payeur de son abonnement."
        name="parentIsPayer"
        onChange={(event) => onChange("parentIsPayer", event.target.checked)}
      />
      <Checkbox
        checked={roles.sameAddress}
        description="Cette information facilitera les prochaines étapes liées aux justificatifs."
        label="L'adresse du parent est aussi l'adresse de l'enfant."
        name="sameAddress"
        onChange={(event) => onChange("sameAddress", event.target.checked)}
      />
    </div>
  );
}
