"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type StoredFamilyUser = {
  firstName?: string;
  email?: string;
};

type AppNavbarProps = {
  userName?: string;
};

type NavChild = { href: string; label: string };

type NavGroup = {
  label: string;
  href: string;
  children: NavChild[] | null;
  requiresAuth?: boolean;
};

const navGroups: NavGroup[] = [
  { label: "Accueil", href: "/", children: null },
  {
    label: "Mon espace famille",
    href: "/dashboard/family",
    requiresAuth: true,
    children: [
      { href: "/dashboard/family", label: "Vue d'ensemble" },
      { href: "/dashboard/family?tab=profiles", label: "Mes profils" },
      { href: "/dashboard/family?tab=titles", label: "Mes titres" },
    ],
  },
  {
    label: "Services",
    href: "/dashboard/family?tab=services",
    children: [
      { href: "/dashboard/family?tab=services", label: "Tous les services" },
      { href: "/found-pass", label: "Signaler un passé trouvé" },
    ],
  },
  {
    label: "Aide",
    href: "/dashboard/family?tab=help",
    children: [
      { href: "/dashboard/family?tab=help", label: "Aide et contacts" },
      { href: "/dashboard/family?tab=alerts", label: "Mes alertes" },
    ],
  },
];

const mobileLinksGuest = [
  { href: "/", label: "Accueil" },
  { href: "/dashboard/family?tab=services", label: "Services" },
  { href: "/found-pass", label: "Signaler un passé trouvé" },
  { href: "/dashboard/family?tab=help", label: "Aide et contacts" },
  { href: "/dashboard/family?tab=alerts", label: "Mes alertes" },
];

const mobileLinksAuth = [
  { href: "/", label: "Accueil" },
  { href: "/dashboard/family", label: "Mon espace famille" },
  { href: "/dashboard/family?tab=profiles", label: "Mes profils" },
  { href: "/dashboard/family?tab=titles", label: "Mes titres" },
  { href: "/dashboard/family?tab=services", label: "Services" },
  { href: "/found-pass", label: "Signaler un passé trouvé" },
  { href: "/dashboard/family?tab=help", label: "Aide et contacts" },
  { href: "/dashboard/family?tab=alerts", label: "Mes alertes" },
];

function getStoredUserName() {
  if (typeof window === "undefined") return undefined;
  const storedUser = sessionStorage.getItem("familyUser");
  if (!storedUser) return undefined;
  try {
    const user = JSON.parse(storedUser) as StoredFamilyUser;
    return user.firstName || user.email;
  } catch {
    return undefined;
  }
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function AppNavbar({ userName }: AppNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [displayName, setDisplayName] = useState(userName);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");
    setIsConnected(Boolean(accessToken));
    setDisplayName(userName || getStoredUserName());
  }, [userName]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setIsUserMenuOpen(false);
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setIsUserMenuOpen(false);
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function handleLogout() {
    localStorage.removeItem("familyAccessToken");
    sessionStorage.removeItem("familyUser");
    setIsConnected(false);
    setDisplayName(undefined);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    router.push("/login");
  }

  function isActivePath(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  }

  function toggleDropdown(label: string) {
    setOpenDropdown((prev) => (prev === label ? null : label));
    setIsUserMenuOpen(false);
    setIsSearchOpen(false);
  }

  function toggleUserMenu() {
    setIsUserMenuOpen((prev) => !prev);
    setOpenDropdown(null);
    setIsSearchOpen(false);
  }

  function toggleSearch() {
    setIsSearchOpen((prev) => !prev);
    setOpenDropdown(null);
    setIsUserMenuOpen(false);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <header ref={headerRef} className="relative z-40 text-idfm-anthracite">
      {/* Barre utilitaire */}
      <div className="hidden border-b border-neutral-light bg-white px-5 py-2 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-idfm-interaction underline-offset-4 hover:underline"
          >
            Compte Famille Navigo
          </Link>
          <div className="flex items-center divide-x divide-neutral-light text-xs text-neutral-medium">
            <Link
              href="/dashboard/family?tab=help"
              className="px-4 underline-offset-4 hover:text-idfm-interaction hover:underline"
            >
              Aide et contacts
            </Link>
            <Link
              href="/found-pass"
              className="px-4 underline-offset-4 hover:text-idfm-interaction hover:underline"
            >
              Passé trouvé
            </Link>
          </div>
        </div>
      </div>

      {/* Barre principale */}
      <div className="bg-idfm-anthracite px-5 text-white">
        <div className="mx-auto flex max-w-7xl items-stretch justify-between gap-2">

          {/* Logo */}
          <Link
            href="/"
            aria-label="Accueil — Compte Famille Navigo"
            className="flex shrink-0 items-center py-3"
          >
            <Image
              src="/assets/logos/idfm-wordmark-horizontal.png"
              alt="Île-de-France Mobilités Connect"
              width={135}
              height={80}
              className="h-auto w-auto"
              priority
            />
          </Link>

          {/* Navigation desktop avec dropdowns */}
          <nav className="hidden items-stretch lg:flex" aria-label="Navigation principale">
            {navGroups.filter((g) => !g.requiresAuth || isConnected).map((group) => (
              <div key={group.label} className="relative flex items-stretch">
                {group.children ? (
                  <button
                    type="button"
                    aria-expanded={openDropdown === group.label}
                    aria-haspopup="true"
                    onClick={() => toggleDropdown(group.label)}
                    className={`flex items-center gap-1.5 px-4 text-sm font-semibold transition ${
                      isActivePath(group.href)
                        ? "border-b-2 border-white text-white"
                        : "border-b-2 border-transparent text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {group.label}
                    <ChevronDownIcon
                      className={`transition-transform duration-200 ${
                        openDropdown === group.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <Link
                    href={group.href}
                    className={`flex items-center px-4 text-sm font-semibold transition ${
                      isActivePath(group.href)
                        ? "border-b-2 border-white text-white"
                        : "border-b-2 border-transparent text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {group.label}
                  </Link>
                )}

                {/* Panneau dropdown */}
                {group.children && openDropdown === group.label && (
                  <div className="absolute left-0 top-full min-w-[220px] overflow-hidden rounded-b-xl bg-white shadow-xl ring-1 ring-black/8">
                    {group.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpenDropdown(null)}
                        className={`block px-5 py-3.5 text-sm transition hover:bg-idfm-light ${
                          isActivePath(child.href)
                            ? "font-semibold text-idfm-interaction"
                            : "text-idfm-anthracite"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions — droite */}
          <div className="flex items-center gap-2 py-3">

            {/* Bouton Rechercher */}
            <div className="relative hidden md:block">
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex h-10 items-center overflow-hidden rounded-full ring-1 ring-white/50">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    className="h-full w-44 bg-white/15 px-4 text-sm text-white placeholder-white/55 outline-none lg:w-52"
                  />
                  <button
                    type="submit"
                    aria-label="Lancer la recherche"
                    className="flex h-full items-center px-3 bg-white/15 transition hover:bg-white/25"
                  >
                    <SearchIcon />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="flex h-10 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <SearchIcon />
                  <span>Rechercher</span>
                </button>
              )}
            </div>

            {/* Bouton Mon espace avec dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                onClick={toggleUserMenu}
                className="flex h-10 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20 sm:px-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <UserIcon />
                </span>
                <span className="hidden max-w-[110px] truncate sm:block">
                  {isConnected ? (displayName ?? "Mon espace") : "Mon espace"}
                </span>
                <ChevronDownIcon
                  className={`hidden transition-transform duration-200 sm:block ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Mon espace */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 min-w-[230px] overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/8">
                  {isConnected ? (
                    <>
                      <div className="border-b border-neutral-light px-5 py-3.5">
                        <p className="text-xs text-neutral-medium">Connecté en tant que</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-idfm-anthracite">
                          {displayName ?? "Mon espace"}
                        </p>
                      </div>
                      <Link
                        href="/dashboard/family"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3 text-sm text-idfm-anthracite transition hover:bg-idfm-light"
                      >
                        Mon espace famille
                      </Link>
                      <Link
                        href="/dashboard/family?tab=profiles"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3 text-sm text-idfm-anthracite transition hover:bg-idfm-light"
                      >
                        Mes profils
                      </Link>
                      <Link
                        href="/dashboard/family?tab=titles"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3 text-sm text-idfm-anthracite transition hover:bg-idfm-light"
                      >
                        Mes titres
                      </Link>
                      <div className="border-t border-neutral-light">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="block w-full px-5 py-3 text-left text-sm text-status-danger transition hover:bg-red-50"
                        >
                          Se déconnecter
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3.5 text-sm font-semibold text-idfm-interaction transition hover:bg-idfm-light"
                      >
                        Connexion
                      </Link>
                      <div className="border-t border-neutral-light">
                        <Link
                          href="/register"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-5 py-3.5 text-sm text-idfm-anthracite transition hover:bg-idfm-light"
                        >
                          Créer mon espace famille
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bouton hamburger — mobile uniquement */}
            <button
              type="button"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-main-navigation"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
              <span className="sr-only">{isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {isMobileMenuOpen && (
          <div id="mobile-main-navigation" className="mx-auto max-w-7xl pb-5 lg:hidden">

            {/* Recherche mobile */}
            <form onSubmit={handleSearchSubmit} className="mb-3 flex h-10 overflow-hidden rounded-full ring-1 ring-white/30">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="h-full flex-1 bg-white/10 px-4 text-sm text-white placeholder-white/55 outline-none"
              />
              <button
                type="submit"
                aria-label="Lancer la recherche"
                className="flex h-full items-center px-4 bg-white/10 transition hover:bg-white/20"
              >
                <SearchIcon />
              </button>
            </form>

            {/* Liens navigation */}
            <nav
              className="overflow-hidden rounded-xl border border-white/15 bg-white text-idfm-anthracite"
              aria-label="Navigation mobile"
            >
              {(isConnected ? mobileLinksAuth : mobileLinksGuest).map((link, index, arr) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-5 py-3.5 text-sm font-medium transition ${
                    index < arr.length - 1 ? "border-b border-neutral-light" : ""
                  } ${
                    isActivePath(link.href)
                      ? "bg-idfm-light font-semibold text-idfm-interaction"
                      : "hover:bg-neutral-xlight"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth mobile */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {isConnected ? (
                <>
                  <Link
                    href="/dashboard/family"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <UserIcon />
                    <span className="truncate">{displayName ?? "Mon espace"}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-full bg-idfm-interaction px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-idfm-focus"
                  >
                    Créer mon espace famille
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
