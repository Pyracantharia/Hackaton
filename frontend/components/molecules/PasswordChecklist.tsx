const rules = [
  { label: "Minimum 12 caractères", test: (value: string) => value.length >= 12 },
  { label: "Une minuscule", test: (value: string) => /[a-z]/.test(value) },
  { label: "Une majuscule", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Un chiffre", test: (value: string) => /\d/.test(value) },
  { label: "Un caractère spécial", test: (value: string) => /[^A-Za-z\d\s]/.test(value) },
  { label: "Aucun espace", test: (value: string) => !/\s/.test(value) },
];

export function isStrongPassword(value: string) {
  return rules.every((rule) => rule.test(value));
}

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <div className="rounded-md border border-neutral-light bg-idfm-light p-4">
      <p className="text-sm font-bold text-idfm-anthracite">Votre mot de passe doit contenir :</p>
      <ul className="mt-3 grid gap-2 text-sm text-neutral-medium sm:grid-cols-2">
        {rules.map((rule) => {
          const valid = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  valid ? "bg-status-success text-white" : "bg-white text-neutral-medium ring-1 ring-neutral-light"
                }`}
              >
                {valid ? "✓" : "•"}
              </span>
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
