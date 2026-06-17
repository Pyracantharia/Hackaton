import { buildApiUrl } from "../api";
import type {
  CreateSubscriptionRequestPayload,
  SubscriptionRequestResponse,
  SubscriptionRequestStatus,
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
