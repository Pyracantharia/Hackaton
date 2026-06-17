import { buildApiUrl } from "../api";
import type {
  AdminDashboardResponse,
  AdminFamilyDetail,
  AdminFamilySummary,
  AdminFoundPassResponse,
  AdminSearchResult,
  AdminSosDashboardResponse,
  AdminSosFilter,
  AdminSubscriptionRequest,
  AdminSupportCase,
  AdminSupportCaseStatus,
  AdminManagementDetail,
  AdminUserRow,
  SubscriptionRequestStatus,
} from "./types";

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = Array.isArray(data?.message)
    ? data.message.join(" ")
    : data?.message ?? "Le service back-office est momentanement indisponible.";

  return message;
}

async function adminFetch<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<T>;
}

export function getAdminDashboard(accessToken: string) {
  return adminFetch<AdminDashboardResponse>(accessToken, "/api/admin/dashboard");
}

export function searchAdminFamilies(accessToken: string, query: string) {
  return adminFetch<AdminSearchResult[]>(accessToken, `/api/admin/search?q=${encodeURIComponent(query)}`);
}

export function getAdminUsers(accessToken: string) {
  return adminFetch<AdminUserRow[]>(accessToken, "/api/admin/users");
}

export function getAdminUser(accessToken: string, id: string) {
  return adminFetch<AdminManagementDetail>(accessToken, `/api/admin/users/${encodeURIComponent(id)}`);
}

export function getAdminFamilies(accessToken: string) {
  return adminFetch<AdminFamilySummary[]>(accessToken, "/api/admin/families");
}

export function getAdminFamily(accessToken: string, id: string) {
  return adminFetch<AdminFamilyDetail>(accessToken, `/api/admin/families/${id}`);
}

export function getAdminSubscriptionRequests(accessToken: string) {
  return adminFetch<AdminSubscriptionRequest[]>(accessToken, "/api/admin/subscription-requests");
}

export function updateAdminSubscriptionRequest(
  accessToken: string,
  id: string,
  status: Extract<SubscriptionRequestStatus, "UNDER_REVIEW" | "WAITING_DOCUMENTS" | "CONFIRMED" | "BLOCKED">,
) {
  return adminFetch<AdminSubscriptionRequest>(accessToken, `/api/admin/subscription-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getAdminSupportCases(accessToken: string) {
  return adminFetch<AdminSupportCase[]>(accessToken, "/api/admin/support-cases");
}

export function updateAdminSupportCase(
  accessToken: string,
  id: string,
  status: Extract<AdminSupportCaseStatus, "IN_PROGRESS" | "RESOLVED">,
) {
  return adminFetch<AdminSupportCase>(accessToken, `/api/admin/support-cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getAdminSosNavigoDashboard(accessToken: string) {
  return adminFetch<AdminSosDashboardResponse>(accessToken, "/api/admin/sos-navigo/dashboard");
}

export function getAdminSosNavigoCases(
  accessToken: string,
  filter: AdminSosFilter = "all",
  query = "",
) {
  const params = new URLSearchParams({ filter, q: query });
  return adminFetch<AdminSupportCase[]>(accessToken, `/api/admin/sos-navigo/cases?${params.toString()}`);
}

export function getAdminSosNavigoCase(accessToken: string, id: string) {
  return adminFetch<AdminSupportCase>(accessToken, `/api/admin/sos-navigo/cases/${id}`);
}

export function registerAdminFoundPass(
  accessToken: string,
  payload: {
    passNumber: string;
    deskName?: string;
  },
) {
  return adminFetch<AdminFoundPassResponse>(accessToken, "/api/admin/sos-navigo/found-pass", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function notifyAdminSosNavigoCase(accessToken: string, id: string) {
  return adminFetch<AdminSupportCase>(accessToken, `/api/admin/sos-navigo/cases/${id}/notify`, {
    method: "PATCH",
  });
}

export function updateAdminSosNavigoCaseStatus(
  accessToken: string,
  id: string,
  status: Extract<
    AdminSupportCaseStatus,
    "IN_PROGRESS" | "PASS_FOUND_WAITING_PICKUP" | "PASS_PICKED_UP" | "RESOLVED"
  >,
) {
  return adminFetch<AdminSupportCase>(accessToken, `/api/admin/sos-navigo/cases/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function markAdminSosNavigoCasePickedUp(accessToken: string, id: string) {
  return adminFetch<AdminSupportCase>(accessToken, `/api/admin/sos-navigo/cases/${id}/picked-up`, {
    method: "PATCH",
  });
}

export function registerAdminSosNavigoFinalChoice(
  accessToken: string,
  id: string,
  payload: {
    finalChoice: "DIGITAL_SUPPORT" | "PHYSICAL_PASS_REACTIVATION";
    digitalSupportRating?: number;
  },
) {
  return adminFetch<AdminSupportCase>(accessToken, `/api/admin/sos-navigo/cases/${id}/final-choice`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function destroyAdminSosNavigoPass(accessToken: string, id: string) {
  return adminFetch<AdminSupportCase>(accessToken, `/api/admin/sos-navigo/cases/${id}/destroy-pass`, {
    method: "PATCH",
  });
}
