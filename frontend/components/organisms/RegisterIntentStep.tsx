import { ChoiceCard } from "../molecules/ChoiceCard";
import { getIntentVisual } from "@/lib/member-visuals";

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
        imageSrc={getIntentVisual("family")}
        onClick={onFamilyStart}
        title="Gérer les titres de ma famille"
      />
      <ChoiceCard
        action="Bientôt disponible"
        badge="Bientôt"
        description="Répondez à quelques questions et obtenez une recommandation adaptée."
        imageSrc={getIntentVisual("personal")}
        onClick={() => onUnavailable("Trouver le bon forfait pour moi")}
        title="Trouver le bon forfait pour moi"
      />
      <ChoiceCard
        action="Bientôt disponible"
        badge="Bientôt"
        description="Découvrez les aides possibles et les justificatifs nécessaires."
        imageSrc={getIntentVisual("discount")}
        onClick={() => onUnavailable("Vérifier mes droits à une réduction")}
        title="Vérifier mes droits à une réduction"
      />
      <ChoiceCard
        action="Bientôt disponible"
        badge="Bientôt"
        description="Accompagnez une personne dans ses démarches en gardant un suivi clair."
        imageSrc={getIntentVisual("helper")}
        onClick={() => onUnavailable("Aider un proche")}
        title="Aider un proche"
      />
    </div>
  );
}
