"use client";

import { useState } from "react";
import { Input } from "./Input";

type PasswordInputProps = Omit<Parameters<typeof Input>[0], "type">;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-16" />
      <button
        type="button"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 top-8 rounded px-2 py-2 text-sm font-semibold text-neutral-medium hover:text-idfm-focus focus-visible:outline-2 focus-visible:outline-idfm-focus"
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? "Masquer" : "Voir"}
      </button>
    </div>
  );
}
