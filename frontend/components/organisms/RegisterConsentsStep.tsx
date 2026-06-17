import { Badge } from "../atoms/Badge";
import { Checkbox } from "../atoms/Checkbox";
import { InfoBox } from "../molecules/InfoBox";
import type { ConsentsForm } from "../register/types";

type RegisterConsentsStepProps = {
  consents: ConsentsForm;
  onChange: (field: keyof ConsentsForm, value: boolean) => void;
};

type PreferenceCardProps = {
  badge: string;
  checked: boolean;
  description: string;
  disabled?: boolean;
  examples: string[];
  id: string;
  label: string;
  onChange?: (checked: boolean) => void;
  tone?: "blue" | "green" | "orange" | "red";
};

function PreferenceCard({
  badge,
  checked,
  description,
  disabled,
  examples,
  id,
  label,
  onChange,
  tone = "blue",
}: PreferenceCardProps) {
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${checked ? "border-idfm-interaction bg-idfm-light" : "border-neutral-light bg-white"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone={tone}>{badge}</Badge>
          <h2 className="mt-3 text-xl font-bold text-idfm-anthracite">{label}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">{description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${checked ? "bg-white text-idfm-focus" : "bg-neutral-xlight text-neutral-medium"}`}>
          {checked ? "Activé" : "Désactivé"}
        </span>
      </div>

      <ul className="mt-4 grid gap-2 text-sm text-neutral-medium">
        {examples.map((example) => (
          <li key={example} className="rounded-xl bg-white/80 px-3 py-2">
            {example}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Checkbox
          checked={checked}
          disabled={disabled}
          id={id}
          label={disabled ? "Toujours actif pour le suivi de vos titres" : checked ? "Je souhaite recevoir ces informations" : "Je ne souhaite pas recevoir ces informations"}
          onChange={(event) => onChange?.(event.target.checked)}
        />
      </div>
    </article>
  );
}

export function RegisterConsentsStep({ consents, onChange }: RegisterConsentsStepProps) {
  return (
    <div className="grid gap-6">
      <InfoBox>
        Cette étape sert à choisir comment votre foyer sera accompagné. Les alertes de service restent actives, les
        conseils utiles et les communications commerciales restent à votre choix.
      </InfoBox>

      <section className="grid gap-4">
        <PreferenceCard
          badge="Indispensable"
          checked={consents.serviceAlerts}
          description="Ce sont les messages nécessaires pour suivre vos titres et éviter les blocages."
          disabled
          examples={[
            "Renouvellement Imagine R à finaliser",
            "Justificatif refusé ou manquant",
            "Paiement bloqué, carte envoyée ou demande mise à jour",
          ]}
          id="serviceAlerts"
          label="Alertes importantes du foyer"
          tone="green"
        />

        <PreferenceCard
          badge="Conseils utiles"
          checked={consents.mobilityNews}
          description="Des rappels et informations adaptés aux profils ajoutés, sans publicité partenaire."
          examples={[
            "Aide à préparer la rentrée des enfants",
            "Offre Senior ou Améthyste à vérifier",
            "Rappel avant une période de forte demande",
          ]}
          id="mobilityNews"
          label="Conseils adaptés à vos profils"
          onChange={(checked) => onChange("mobilityNews", checked)}
        />

        <PreferenceCard
          badge="Optionnel"
          checked={consents.partnerOffers}
          description="Des communications commerciales ou partenaires. Cette option reste décochée par défaut."
          examples={[
            "Offres partenaires liées à la mobilité",
            "Communications commerciales non nécessaires au service",
          ]}
          id="partnerOffers"
          label="Offres partenaires"
          onChange={(checked) => onChange("partnerOffers", checked)}
          tone="orange"
        />
      </section>

      <div className="rounded-2xl border border-neutral-light bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-idfm-anthracite">Récapitulatif simple</h2>
            <p className="mt-1 text-sm text-neutral-medium">Vous pourrez modifier ces choix plus tard dans votre espace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">Service actif</Badge>
            <Badge tone={consents.mobilityNews ? "blue" : "orange"}>Conseils {consents.mobilityNews ? "activés" : "désactivés"}</Badge>
            <Badge tone={consents.partnerOffers ? "blue" : "orange"}>Partenaires {consents.partnerOffers ? "activés" : "désactivés"}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
