import { InfoBox } from "../molecules/InfoBox";

const questions = [
  "Comment renouveler un forfait Imagine R ?",
  "Que faire si j'ai perdu un passe Navigo ?",
  "Comment savoir si une personne agee peut beneficier d'une offre adaptee ?",
  "Quels justificatifs preparer pour un enfant scolarise ?",
  "Comment fonctionne le role porteur / payeur ?",
];

export function FamilyHelpSection() {
  return (
    <section id="help" className="mt-12">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-bold text-idfm-anthracite">Aide et contacts</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">
            Les questions frequentes sont reformulees pour les usages famille, jeune et senior.
          </p>
          <div className="mt-5 grid gap-3">
            <InfoBox>
              Les explications du foyer evitent le jargon et distinguent clairement gestionnaire, porteur et payeur.
            </InfoBox>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
          <ul className="grid gap-4">
            {questions.map((question) => (
              <li key={question} className="border-b border-neutral-light pb-4 last:border-b-0 last:pb-0">
                <a href="/dashboard/family?tab=help" className="text-sm font-semibold text-idfm-interaction hover:underline">
                  {question}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md border border-idfm-interaction px-5 text-sm font-semibold text-idfm-interaction transition hover:bg-idfm-light focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
          >
            Voir toutes les questions
          </button>
        </div>
      </div>
    </section>
  );
}
