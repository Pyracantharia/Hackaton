import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-idfm-light">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <p className="mb-3 text-sm font-semibold text-idfm-interaction">Île-de-France Mobilités Connect</p>
        <h1 className="max-w-2xl text-3xl font-bold text-idfm-anthracite sm:text-5xl">
          Gérez les titres de transport de votre famille depuis un seul espace.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-medium sm:text-lg">
          Un parcours pensé pour les parents qui créent, suivent et renouvellent les dossiers de leurs enfants.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-idfm-interaction px-6 text-base font-semibold text-white shadow-sm transition hover:bg-idfm-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
        >
          Créer mon espace famille
        </Link>
      </main>
    </div>
  );
}
