"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/templates/DashboardLayout";

type StoredUser = {
  firstName?: string;
  lastName?: string;
  role?: string;
};

function parseStoredUser(value: string | null): StoredUser | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    return null;
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("familyAccessToken");
    const storedUser = parseStoredUser(sessionStorage.getItem("familyUser"));

    if (!accessToken || storedUser?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }

    queueMicrotask(() => {
      setUser(storedUser);
      setIsCheckingAccess(false);
    });
  }, [router]);

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : "Admin";

  return (
    <DashboardLayout
      activeTab="admin"
      basePath="/dashboard/admin"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { label: "Administration" },
      ]}
      showHeaderAction={false}
      showTabs={false}
      subtitle="Espace de pilotage administrateur."
      summaryItems={isCheckingAccess ? ["Verification de la session"] : ["Connecte en administrateur"]}
      title="Dashboard administrateur"
      userName={userName}
    >
      {null}
    </DashboardLayout>
  );
}
