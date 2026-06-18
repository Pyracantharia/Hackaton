import { buildApiUrl } from "../api";
import type {
  CreateImagineRSubscriptionDraftPayload,
  CreateSubscriptionRequestPayload,
  SubscriptionRequestResponse,
  SubscriptionRequestStatus,
  UpdateImagineRSubscriptionPayload,
} from "./types";

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = Array.isArray(data?.message)
    ? data.message.join(" ")
    : data?.message ?? "Le service est momentanement indisponible.";

  return message;
}

export async function createSubscriptionRequest(
  accessToken: string,
  payload: CreateSubscriptionRequestPayload,
): Promise<SubscriptionRequestResponse> {
  const response = await fetch(buildApiUrl("/api/subscription-requests"), {
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

  return response.json() as Promise<SubscriptionRequestResponse>;
}

export async function getSubscriptionRequest(
  accessToken: string,
  id: string,
): Promise<SubscriptionRequestResponse> {
  const response = await fetch(buildApiUrl(`/api/subscription-requests/${id}`), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SubscriptionRequestResponse>;
}

export async function updateSubscriptionRequest(
  accessToken: string,
  id: string,
  payload: Partial<{
    intelligentDossierEnabled: boolean;
    autoRenewalEnabled: boolean;
    renewalMonths: number;
    status: SubscriptionRequestStatus;
  }>,
): Promise<SubscriptionRequestResponse> {
  const response = await fetch(buildApiUrl(`/api/subscription-requests/${id}`), {
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

  return response.json() as Promise<SubscriptionRequestResponse>;
}

export async function cancelSubscriptionRenewal(
  accessToken: string,
  id: string,
): Promise<SubscriptionRequestResponse> {
  const response = await fetch(buildApiUrl(`/api/subscription-requests/${id}/renewal/cancel`), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SubscriptionRequestResponse>;
}

export async function createImagineRSubscriptionDraft(
  accessToken: string,
  payload: CreateImagineRSubscriptionDraftPayload,
): Promise<SubscriptionRequestResponse> {
  const response = await fetch(buildApiUrl("/api/subscription-requests/imagine-r/draft"), {
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

  return response.json() as Promise<SubscriptionRequestResponse>;
}

export async function updateImagineRSubscriptionDraft(
  accessToken: string,
  id: string,
  payload: UpdateImagineRSubscriptionPayload,
): Promise<SubscriptionRequestResponse> {
  const response = await fetch(buildApiUrl(`/api/subscription-requests/${id}/imagine-r`), {
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

  return response.json() as Promise<SubscriptionRequestResponse>;
}

export async function uploadImagineRSubscriptionDocumentFile(
  accessToken: string,
  id: string,
  documentType: "PHOTO" | "ID_DOCUMENT" | "SCHOOL_CERTIFICATE" | "SCHOLARSHIP_CERTIFICATE" | "SITUATION_PROOF" | "PAYMENT_METHOD" | "ADDRESS_PROOF",
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl(`/api/subscription-requests/${id}/imagine-r/documents/${documentType}/file`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json();
}

export async function submitImagineRSubscriptionDraft(
  accessToken: string,
  id: string,
): Promise<SubscriptionRequestResponse> {
  const response = await fetch(buildApiUrl(`/api/subscription-requests/${id}/imagine-r/submit`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<SubscriptionRequestResponse>;
}
