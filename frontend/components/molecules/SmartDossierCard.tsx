import { Checkbox } from "../atoms/Checkbox";

type SmartDossierCardProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function SmartDossierCard({ checked, onChange }: SmartDossierCardProps) {
  return (
    <div className="rounded-2xl border border-idfm-medium bg-idfm-light p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">Dossier intelligent</p>
      <h3 className="mt-2 text-xl font-bold text-idfm-anthracite">Simplifier mon dossier</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-medium">
        Simulation sécurisée pour préremplir certaines informations. Vous gardez le contrôle.
      </p>
      <div className="mt-4">
        <Checkbox
          checked={checked}
          label="Utiliser le dossier intelligent"
          description="Identité, adresse et situation peuvent être préparées sans connexion externe réelle."
          onChange={(event) => onChange(event.target.checked)}
        />
      </div>
    </div>
  );
}
