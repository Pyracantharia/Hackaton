import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { InfoBox } from "@/components/molecules/InfoBox";
import { QuickActionCard } from "@/components/molecules/QuickActionCard";

const solutionItems = [
  {
    title: "Un foyer, plusieurs profils",
    description: "Ajoutez un enfant, un jeune, un senior ou un proche accompagne dans le meme espace.",
    imageSrc: "/assets/logos/pictogrammes/family-pictogram.png",
  },
  {
    title: "Renouvellements anticipes",
    description: "Reperez les titres a renouveler avant les periodes importantes comme la rentree.",
    imageSrc: "/assets/illustrations/navigo-card-vertical.png",
  },
  {
    title: "Dossiers plus lisibles",
    description: "Retrouvez les documents, statuts et prochaines actions pour chaque membre du foyer.",
    imageSrc: "/assets/illustrations/service-kiosk-terminal.png",
  },
  {
    title: "Demarches du quotidien",
    description: "Centralisez les demandes utiles : carte perdue, passe trouve, suivi et assistance.",
    imageSrc: "/assets/illustrations/hand-tapping-contactless.png",
  },
];

const mainTargets = [
  {
    title: "Jeune / enfant scolarise",
    description: "Suivre le dossier Imagine R, anticiper la rentree et guider le parent payeur.",
    badge: "MVP",
    imageSrc: "/assets/illustrations/young-girl-waving.png",
  },
  {
    title: "Senior / retraite",
    description: "Verifier une offre adaptee, clarifier les justificatifs et accompagner la souscription.",
    badge: "MVP",
    imageSrc: "/assets/illustrations/senior-woman-with-cane.png",
  },
];

const futureTargets = [
  "Conjoint",
  "Proche aide",
  "Etudiant",
  "Beneficiaire d'une reduction",
];

const useCases = [
  {
    title: "Renouveler Imagine R",
    description: "Lucas approche de la rentree : le foyer voit le renouvellement conseille et les pieces a preparer.",
    imageSrc: "/assets/iconparcours/logo imagine-R.svg",
  },
  {
    title: "Verifier une offre senior",
    description: "Marie peut etre orientee vers une offre adaptee a sa situation sans chercher dans plusieurs pages.",
    imageSrc: "/assets/logos/pictogrammes/senior-pass-card.png",
  },
  {
    title: "Suivre une carte perdue",
    description: "Le gestionnaire choisit le profil concerne et retrouve l'etat de la demande depuis son espace.",
    imageSrc: "/assets/illustrations/hand-holding-ticket.png",
  },
];

const benefits = [
  "Un seul espace pour toute la famille",
  "Moins d'oubli avant la rentree",
  "Des profils accompagnes plus simplement",
  "Une meilleure visibilite sur les demarches",
];

function HomeCtaLink({
  children,
  href,
  variant = "primary",
}: {
  children: string;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "bg-idfm-interaction text-white hover:bg-idfm-focus"
      : "border border-idfm-interaction bg-white text-idfm-interaction hover:bg-idfm-light";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 text-sm font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus sm:w-auto ${className}`}
    >
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-xlight text-idfm-anthracite">
      <header className="border-b border-white/10 bg-idfm-anthracite px-5 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" aria-label="Accueil Compte Famille Navigo">
            <Image
              src="/assets/logos/idfm-logo.svg"
              alt="Ile-de-France Mobilites"
              width={176}
              height={42}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Navigation principale">
            <a href="#solution" className="hover:text-idfm-blue">Notre solution</a>
            <a href="#cibles" className="hover:text-idfm-blue">Cibles</a>
            <a href="#actions" className="hover:text-idfm-blue">Actions utiles</a>
          </nav>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center rounded-md bg-white px-4 text-sm font-semibold text-idfm-interaction transition hover:bg-idfm-light focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-blue"
          >
            Mon espace
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
        <div>
          <Badge>Compte Famille Navigo</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-idfm-anthracite sm:text-5xl lg:text-6xl">
            Gerez les abonnements Navigo de votre foyer simplement
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-medium">
            Un seul espace pour suivre les titres, renouvellements et demarches de vos proches : enfant, jeune,
            senior et plus encore.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <HomeCtaLink href="/register">Creer mon espace famille</HomeCtaLink>
            <HomeCtaLink href="/login" variant="secondary">Me connecter</HomeCtaLink>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Profils du foyer", "Renouvellements", "Demarches Navigo"].map((item) => (
              <div key={item} className="rounded-2xl border border-neutral-light bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-neutral-light bg-white p-5 shadow-sm">
            <Image
              src="/assets/illustrations/register-family.svg"
              alt="Famille utilisant les transports Ile-de-France Mobilites"
              width={720}
              height={520}
              className="h-auto w-full rounded-3xl bg-idfm-light object-contain p-4"
              priority
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Sophie", "Gestionnaire"],
                ["Lucas", "Imagine R"],
                ["Marie", "Senior"],
              ].map(([name, role]) => (
                <div key={name} className="rounded-2xl bg-idfm-light p-4">
                  <p className="font-bold">{name}</p>
                  <p className="mt-1 text-sm text-neutral-medium">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="solution" className="mx-auto w-full max-w-7xl px-5 py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">Notre solution</p>
          <h2 className="mt-3 text-3xl font-bold">Tout ce qui concerne les titres du foyer, au meme endroit</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {solutionItems.map((item) => (
            <article key={item.title} className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-idfm-light">
                <Image src={item.imageSrc} alt="" width={56} height={56} className="h-12 w-12 object-contain" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-medium">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="cibles" className="mx-auto w-full max-w-7xl px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">Nos cibles</p>
            <h2 className="mt-3 text-3xl font-bold">Une logique familiale, adaptee aux profils accompagnes</h2>
            <p className="mt-3 text-base leading-7 text-neutral-medium">
              Le MVP met surtout en avant les jeunes scolarises et les seniors, tout en montrant que le foyer peut
              s&apos;elargir progressivement.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {mainTargets.map((target) => (
              <article key={target.title} className="rounded-2xl border border-idfm-medium bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <Image src={target.imageSrc} alt="" width={96} height={96} className="h-24 w-24 object-contain" aria-hidden="true" />
                  <Badge tone="green">{target.badge}</Badge>
                </div>
                <h3 className="mt-5 text-xl font-bold">{target.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-medium">{target.description}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {futureTargets.map((target) => (
            <span key={target} className="rounded-full border border-neutral-light bg-white px-4 py-2 text-sm font-semibold text-neutral-medium">
              {target} · bientot disponible
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10">
        <div className="rounded-[2rem] bg-idfm-light p-5 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">Exemples concrets</p>
            <h2 className="mt-3 text-3xl font-bold">Des cas d&apos;usage simples pour la demo</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <article key={useCase.title} className="rounded-2xl bg-white p-5 shadow-sm">
                <Image src={useCase.imageSrc} alt="" width={80} height={80} className="h-16 w-16 object-contain" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-bold">{useCase.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-medium">{useCase.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="actions" className="mx-auto w-full max-w-7xl px-5 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">Actions utiles</p>
            <h2 className="mt-3 text-3xl font-bold">Acceder vite aux demarches importantes</h2>
          </div>
          <InfoBox>Les actions non finalisees restent des parcours credibles pour la demo hackathon.</InfoBox>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <QuickActionCard
            description="Demarrer le parcours famille depuis la creation du compte."
            href="/register"
            imageSrc="/assets/logos/pictogrammes/family-pictogram.png"
            title="Creer un espace"
          />
          <QuickActionCard
            description="Voir les profils, les alertes et les prochaines actions."
            href="/dashboard/family?tab=profiles"
            imageSrc="/assets/logos/pictogrammes/user-profile-pictogram.png"
            title="Gerer mes profils"
          />
          <QuickActionCard
            description="Retrouver les titres a renouveler et les dossiers en cours."
            href="/dashboard/family?tab=titles"
            imageSrc="/assets/illustrations/navigo-card-vertical.png"
            title="Renouveler un titre"
          />
          <QuickActionCard
            description="Choisir le profil concerne et suivre la demande."
            href="/dashboard/family?tab=services"
            imageSrc="/assets/illustrations/hand-holding-ticket.png"
            title="Passe perdu"
          />
          <QuickActionCard
            description="Signaler un passe trouve sans compte utilisateur."
            href="/found-pass"
            imageSrc="/assets/illustrations/contactless-validator-round.png"
            title="Passe trouve"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10">
        <div className="grid gap-6 rounded-[2rem] border border-neutral-light bg-white p-6 shadow-sm lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-idfm-interaction">Pourquoi c&apos;est utile ?</p>
            <h2 className="mt-3 text-3xl font-bold">Moins d&apos;administratif, plus de visibilite</h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="rounded-2xl bg-idfm-light px-4 py-3 text-sm font-semibold">
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mt-10 bg-idfm-anthracite px-5 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Image
              src="/assets/logos/idfm-logo-horizontal.png"
              alt="Ile-de-France Mobilites"
              width={180}
              height={48}
              className="h-10 w-auto"
            />
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Prototype hackathon centre sur la gestion des abonnements Navigo et des profils du foyer.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/75">
            <span>Mentions legales</span>
            <span>Accessibilite</span>
            <span>Donnees personnelles</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
