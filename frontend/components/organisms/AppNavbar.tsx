"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button";

type StoredFamilyUser = {
  firstName?: string;
  email?: string;
};

type AppNavbarProps = {
  userName?: string;
};

const mainLinks = [
  { href: "/", label: "Accueil" },
  { href: "/dashboard/family", label: "Mon espace famille" },
  { href: "/dashboard/family?tab=profiles", label: "Mes profils" },
  { href: "/dashboard/family?tab=titles", label: "Mes titres" },
  { href: "/dashboard/family?tab=services", label: "Services" },
  { href: "/dashboard/family?tab=help", label: "Aide" },
  { href: "/found-pass", label: "Signaler un passe trouve" },
];

function getStoredUserName() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const storedUser = sessionStorage.getItem("familyUser");

  if (!storedUser) {
    return undefined;
  }

  try {
    const user = JSON.parse(storedUser) as StoredFamilyUser;
    return user.firstName || user.email;
  } catch {
    return undefined;
  }
}

export function AppNavbar({ userName }: AppNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [displayName, setDisplayName] = useState(userName);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");
    setIsConnected(Boolean(accessToken));
    setDisplayName(userName || getStoredUserName());
  }, [userName]);

  function handleLogout() {
    localStorage.removeItem("familyAccessToken");
    sessionStorage.removeItem("familyUser");
    setIsConnected(false);
    setDisplayName(undefined);
    setIsMenuOpen(false);
    router.push("/login");
  }

  function isActiveLink(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href.split("?")[0]);
  }

  return (
    <header className="border-b border-neutral-light bg-white text-idfm-anthracite">
      <div className="hidden border-b border-neutral-light px-5 py-2 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs font-semibold text-idfm-interaction">
          <Link href="/" className="underline-offset-4 hover:underline">
            Compte Famille Navigo
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/dashboard/family?tab=help" className="underline-offset-4 hover:underline">
              Aide et contacts
            </Link>
            <Link href="/found-pass" className="underline-offset-4 hover:underline">
              Passe trouve
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-idfm-anthracite px-5 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" aria-label="Accueil Compte Famille Navigo" className="shrink-0">
            <Image
              src="/assets/logos/idfm-connect-logo.svg"
              alt="Ile-de-France Mobilites Connect"
              width={250}
              height={52}
              className="h-10 w-auto rounded-md bg-white px-3 py-1.5 sm:h-11"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-white/10 ${
                  isActiveLink(link.href) ? "bg-white/15 text-white" : "text-white/85"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isConnected ? (
              <>
                <Link
                  href="/dashboard/family"
                  className="inline-flex min-h-11 items-center rounded-md bg-white px-4 text-sm font-semibold text-idfm-interaction transition hover:bg-idfm-light"
                >
                  {displayName || "Mon espace"}
                </Link>
                <Button type="button" variant="secondary" onClick={handleLogout}>
                  Se deconnecter
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="contents">
                  <Button type="button" variant="secondary">Connexion</Button>
                </Link>
                <Link href="/register" className="contents">
                  <Button type="button">Creer mon espace famille</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10 xl:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-main-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            Menu
          </button>
        </div>

        {isMenuOpen ? (
          <div id="mobile-main-navigation" className="mx-auto mt-4 grid max-w-7xl gap-4 rounded-md border border-white/15 bg-white p-4 text-idfm-anthracite xl:hidden">
            <nav className="grid gap-1" aria-label="Navigation mobile">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-3 text-sm font-semibold ${
                    isActiveLink(link.href) ? "bg-idfm-light text-idfm-interaction" : "hover:bg-neutral-xlight"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="grid gap-2 border-t border-neutral-light pt-4 sm:grid-cols-2">
              {isConnected ? (
                <>
                  <Link href="/dashboard/family" className="contents" onClick={() => setIsMenuOpen(false)}>
                    <Button type="button">{displayName || "Mon espace"}</Button>
                  </Link>
                  <Button type="button" variant="secondary" onClick={handleLogout}>
                    Se deconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="contents" onClick={() => setIsMenuOpen(false)}>
                    <Button type="button" variant="secondary">Connexion</Button>
                  </Link>
                  <Link href="/register" className="contents" onClick={() => setIsMenuOpen(false)}>
                    <Button type="button">Creer mon espace famille</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
