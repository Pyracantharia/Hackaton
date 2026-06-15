import { ChoiceCard } from "../molecules/ChoiceCard";

type RegisterIntentStepProps = {
  onFamilyStart: () => void;
  onUnavailable: (title: string) => void;
};

export function RegisterIntentStep({ onFamilyStart, onUnavailable }: RegisterIntentStepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ChoiceCard
        action="Commencer"
        badge="Actif"
        description="Ajoutez vos enfants, renouvelez leurs forfaits et suivez leurs dossiers depuis un seul espace."
        icon="/assets/icons/family.svg"
        onClick={onFamilyStart}
        title="Gérer les titres de ma famille"
      />
      <ChoiceCard
        action="Bientôt disponible"
        badge="Bientôt"
        description="Répondez à quelques questions et obtenez une recommandation adaptée."
        icon="/assets/icons/user.svg"
        onClick={() => onUnavailable("Trouver le bon forfait pour moi")}
        title="Trouver le bon forfait pour moi"
      />
      <ChoiceCard
        action="Bientôt disponible"
        badge="Bientôt"
        description="Découvrez les aides possibles et les justificatifs nécessaires."
        icon="/assets/icons/discount.svg"
        onClick={() => onUnavailable("Vérifier mes droits à une réduction")}
        title="Vérifier mes droits à une réduction"
      />
      <ChoiceCard
        action="Bientôt disponible"
        badge="Bientôt"
        description="Accompagnez une personne dans ses démarches en gardant un suivi clair."
        icon="/assets/icons/helper.svg"
        onClick={() => onUnavailable("Aider un proche")}
        title="Aider un proche"
      />
    </div>
  );
}
