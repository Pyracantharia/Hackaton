import { buildApiUrl } from "../api";
import type {
  AddHouseholdMemberPayload,
  CancelSupportCaseResponse,
  FoundPassPayload,
  FoundPassResponse,
  FinalChoicePayload,
  HouseholdDashboardResponse,
  HouseholdProceduresResponse,
  LostPassPayload,
  LostPassResponse,
  MemberDetailResponse,
  NavigoPass,
  NavigoPassSupportType,
  SupportCaseDetail,
  SupportCaseSummary,
  SupportCasesListResponse,
} from "./types";

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = Array.isArray(data?.message)
    ? data.message.join(" ")
    : data?.message ?? "Le service est momentanement indisponible.";

  return message;
}

export async function switchNavigoPassSupport(
  accessToken: string,
  memberId: string,
  targetSupport: NavigoPassSupportType,
): Promise<NavigoPass> {
  const response = await fetch(buildApiUrl(`/api/navigo-passes/members/${memberId}/switch-support`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetSupport }),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<NavigoPass>;
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

export async function getMyHouseholdProcedures(accessToken: string): Promise<HouseholdProceduresResponse> {
  const response = await fetch(buildApiUrl("/api/households/me/procedures"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<HouseholdProceduresResponse>;
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

export async function addHouseholdMember(
  accessToken: string,
  payload: AddHouseholdMemberPayload,
): Promise<HouseholdDashboardResponse> {
  const response = await fetch(buildApiUrl("/api/households/me/members"), {
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

  return response.json() as Promise<HouseholdDashboardResponse>;
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

export async function getMySupportCases(
  accessToken: string,
): Promise<SupportCasesListResponse> {
  const response = await fetch(buildApiUrl("/api/support-cases/me"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SupportCasesListResponse>;
}

export async function getSupportCaseDetail(
  accessToken: string,
  supportCaseId: string,
): Promise<SupportCaseDetail> {
  const response = await fetch(buildApiUrl(`/api/support-cases/${supportCaseId}`), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SupportCaseDetail>;
}

export async function cancelSupportCase(
  accessToken: string,
  supportCaseId: string,
): Promise<CancelSupportCaseResponse> {
  const response = await fetch(buildApiUrl(`/api/support-cases/${supportCaseId}/cancel`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<CancelSupportCaseResponse>;
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

export async function getRecoveredSupportAlerts(accessToken: string): Promise<SupportCaseSummary[]> {
  const response = await fetch(buildApiUrl("/api/support-cases/recovered-alerts"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SupportCaseSummary[]>;
}

export async function markSupportCasePickedUp(
  accessToken: string,
  supportCaseId: string,
): Promise<SupportCaseDetail> {
  const response = await fetch(buildApiUrl(`/api/support-cases/${supportCaseId}/picked-up`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SupportCaseDetail>;
}

export async function registerSupportCaseFinalChoice(
  accessToken: string,
  supportCaseId: string,
  payload: FinalChoicePayload,
): Promise<SupportCaseDetail> {
  const response = await fetch(buildApiUrl(`/api/support-cases/${supportCaseId}/final-choice`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SupportCaseDetail>;
}
