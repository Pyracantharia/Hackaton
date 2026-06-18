"use client";

import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: {
      callback: (response: GoogleCredentialResponse) => void;
      client_id: string;
      context?: "signin" | "signup" | "use";
      ux_mode?: "popup";
    }) => void;
    prompt: () => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

type GoogleAuthButtonProps = {
  disabled?: boolean;
  label: string;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

const scriptId = "google-identity-services";

function loadGoogleScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google est indisponible pour le moment.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google est indisponible pour le moment."));
    document.head.appendChild(script);
  });
}

export function GoogleAuthButton({ disabled = false, label, onCredential, onError }: GoogleAuthButtonProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const initializedRef = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    void loadGoogleScript()
      .then(() => setIsReady(true))
      .catch((error: Error) => onError(error.message));
  }, [clientId, onError]);

  async function handleClick() {
    if (!clientId) {
      onError("La connexion Google n'est pas configurée.");
      return;
    }

    setIsLoading(true);

    try {
      await loadGoogleScript();

      if (!window.google?.accounts) {
        throw new Error("Google est indisponible pour le moment.");
      }

      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          callback: (response) => {
            setIsLoading(false);

            if (!response.credential) {
              onError("Google n'a pas retourné de jeton de connexion.");
              return;
            }

            onCredential(response.credential);
          },
          client_id: clientId,
          context: "signin",
          ux_mode: "popup",
        });
        initializedRef.current = true;
      }

      window.google.accounts.id.prompt();
    } catch (error) {
      setIsLoading(false);
      onError(error instanceof Error ? error.message : "Connexion Google impossible.");
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || isLoading || !isReady}
      onClick={handleClick}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-neutral-light bg-white px-5 text-sm font-semibold text-idfm-anthracite transition hover:border-idfm-interaction hover:bg-idfm-light focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus disabled:cursor-not-allowed disabled:bg-neutral-xlight disabled:text-neutral-medium"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-base font-bold text-[#4285f4]" aria-hidden="true">
        G
      </span>
      {isLoading ? "Connexion Google..." : label}
    </button>
  );
}
