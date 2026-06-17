import { buildApiUrl } from "../api";
import type {
  AdminDashboardResponse,
  AdminFamilyDetail,
  AdminFamilySummary,
  AdminSearchResult,
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
