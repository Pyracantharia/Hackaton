import { DashboardTab } from "../molecules/DashboardTab";

type FamilyDashboardTabsProps = {
  activeTab: string;
  basePath?: string;
};

const tabs = [
  { id: "overview", label: "Vue d'ensemble", icon: "/assets/icons/family.svg" },
  { id: "profiles", label: "Profils", icon: "/assets/icons/user.svg" },
  { id: "titles", label: "Titres", icon: "/assets/icons/check.svg" },
  { id: "services", label: "Services", icon: "/assets/icons/shield.svg" },
  { id: "alerts", label: "Alertes", icon: "/assets/icons/info.svg" },
  { id: "help", label: "Aide", icon: "/assets/icons/helper.svg" },
];

function buildTabHref(basePath: string, tabId: string) {
  if (tabId === "overview") {
    return basePath;
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
