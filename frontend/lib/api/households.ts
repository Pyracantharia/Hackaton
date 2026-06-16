import { buildApiUrl } from "../api";
import type {
  FoundPassPayload,
  FoundPassResponse,
  HouseholdDashboardResponse,
  LostPassPayload,
  LostPassResponse,
  MemberDetailResponse,
} from "./types";

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = Array.isArray(data?.message)
    ? data.message.join(" ")
    : data?.message ?? "Le service est momentanement indisponible.";

  return message;
}

export async function getMyHouseholdDashboard(accessToken: string): Promise<HouseholdDashboardResponse> {
  const response = await fetch(buildApiUrl("/api/households/me/dashboard"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<HouseholdDashboardResponse>;
}

export async function getHouseholdMemberDetail(
  accessToken: string,
  memberId: string,
): Promise<MemberDetailResponse> {
  const response = await fetch(buildApiUrl(`/api/households/me/members/${memberId}`), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<MemberDetailResponse>;
}

export async function createLostPassSupportCase(
  accessToken: string,
  payload: LostPassPayload,
): Promise<LostPassResponse> {
  const response = await fetch(buildApiUrl("/api/support-cases/lost-pass"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<LostPassResponse>;
}

export async function createFoundPassSupportCase(
  payload: FoundPassPayload,
): Promise<FoundPassResponse> {
  const response = await fetch(buildApiUrl("/api/support-cases/found-pass"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<FoundPassResponse>;
}
