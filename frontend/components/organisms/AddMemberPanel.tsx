import { ChoiceCard } from "../molecules/ChoiceCard";
import { getAddMemberVisual } from "@/lib/member-visuals";

type AddMemberPanelProps = {
  onSelectProfile: (profileType: string) => void;
};

const options = [
  {
    key: "young",
    title: "Enfant / jeune",
    description: "Ajouter un profil scolaire avec titre, justificatifs et renouvellement.",
    badge: "Actif",
    imageSrc: getAddMemberVisual("young"),
  },
  {
    key: "senior",
    title: "Retraite / senior",
    description: "Accompagner un parent age vers une offre Senior ou Amethyste.",
    badge: "Actif",
    imageSrc: getAddMemberVisual("senior"),
  },
  {
    key: "partner",
    title: "Conjoint",
    description: "Mutualiser la gestion d'un profil adulte au sein du foyer.",
    badge: "Bientot",
    imageSrc: getAddMemberVisual("partner"),
  },
  {
    key: "caregiver",
    title: "Proche aide",
    description: "Suivre un dossier accompagne avec plus d'etapes explicatives.",
    badge: "Bientot",
    imageSrc: getAddMemberVisual("caregiver"),
  },
  {
    key: "student",
    title: "Etudiant",
    description: "Etendre le compte famille a un parcours etudiant et pieces adaptees.",
    badge: "Bientot",
    imageSrc: getAddMemberVisual("student"),
  },
  {
    key: "discount",
    title: "Reduction",
    description: "Verifier des droits et centraliser les justificatifs a venir.",
    badge: "Bientot",
    imageSrc: getAddMemberVisual("discount"),
  },
];

export function AddMemberPanel({ onSelectProfile }: AddMemberPanelProps) {
  return (
    <section className="mt-12">
      <div>
        <h2 className="text-2xl font-bold text-idfm-anthracite">Ajouter un profil au foyer</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-medium">
          Le compte famille est pense pour s&apos;etendre a d&apos;autres situations sans perdre en lisibilite.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <ChoiceCard
            key={option.key}
            badge={option.badge}
            description={option.description}
            imageSrc={option.imageSrc}
            onClick={() => onSelectProfile(option.key)}
            title={option.title}
            action={option.badge === "Actif" ? "Explorer" : "Bientot disponible"}
          />
        ))}
      </div>
    </section>
  );
}
