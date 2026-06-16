import { ChoiceCard } from "../molecules/ChoiceCard";

type AddMemberPanelProps = {
  onSelectProfile: (profileType: string) => void;
};

const options = [
  {
    key: "young",
    title: "Enfant / jeune",
    description: "Ajouter un profil scolaire avec titre, justificatifs et renouvellement.",
    badge: "Actif",
    icon: "/assets/icons/child.svg",
  },
  {
    key: "senior",
    title: "Retraite / senior",
    description: "Accompagner un parent age vers une offre Senior ou Amethyste.",
    badge: "Actif",
    icon: "/assets/icons/user.svg",
  },
  {
    key: "partner",
    title: "Conjoint",
    description: "Mutualiser la gestion d'un profil adulte au sein du foyer.",
    badge: "Bientot",
    icon: "/assets/icons/family.svg",
  },
  {
    key: "caregiver",
    title: "Proche aide",
    description: "Suivre un dossier accompagne avec plus d'etapes explicatives.",
    badge: "Bientot",
    icon: "/assets/icons/helper.svg",
  },
  {
    key: "student",
    title: "Etudiant",
    description: "Etendre le compte famille a un parcours etudiant et pieces adaptees.",
    badge: "Bientot",
    icon: "/assets/icons/discount.svg",
  },
  {
    key: "discount",
    title: "Reduction",
    description: "Verifier des droits et centraliser les justificatifs a venir.",
    badge: "Bientot",
    icon: "/assets/icons/info.svg",
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
            icon={option.icon}
            onClick={() => onSelectProfile(option.key)}
            title={option.title}
            action={option.badge === "Actif" ? "Explorer" : "Bientot disponible"}
          />
        ))}
      </div>
    </section>
  );
}
