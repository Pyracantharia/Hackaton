import { DashboardTab } from "../molecules/DashboardTab";

type FamilyDashboardTabsProps = {
  activeTab: string;
  basePath?: string;
};

const tabs = [
  { id: "welcome", label: "Bienvenue", icon: "/assets/iconparcours/svgexport-2.svg" },
  { id: "overview", label: "Vue d'ensemble", icon: "/assets/iconparcours/svgexport-1.svg" },
  { id: "profiles", label: "Profils", icon: "/assets/iconparcours/Femme.svg" },
  { id: "titles", label: "Titres", icon: "/assets/iconparcours/svgexport-3.svg" },
  { id: "services", label: "Services", icon: "/assets/iconparcours/svgexport-5.svg" },
  { id: "demarches", label: "Démarches", icon: "/assets/iconparcours/svgexport-10.svg" },
  { id: "alerts", label: "Alertes", icon: "/assets/iconparcours/svgexport-7.svg" },
  { id: "help", label: "Aide", icon: "/assets/iconparcours/svgexport-8.svg" },
];

function buildTabHref(basePath: string, tabId: string) {
  if (tabId === "welcome") {
    return basePath;
  }

  if (tabId === "titles") {
    return `${basePath}/titles`;
  }

  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}tab=${tabId}`;
}

export function FamilyDashboardTabs({
  activeTab,
  basePath = "/dashboard/family",
}: FamilyDashboardTabsProps) {
  return (
    <nav className="overflow-x-auto border-b border-neutral-light">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => (
          <DashboardTab
            key={tab.id}
            href={buildTabHref(basePath, tab.id)}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            label={tab.label}
          />
        ))}
      </div>
    </nav>
  );
}
