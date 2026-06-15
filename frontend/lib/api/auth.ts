import { buildApiUrl } from "../api";
import type { RegisterFamilyPayload, RegisterFamilyResponse } from "./types";

export async function registerFamily(payload: RegisterFamilyPayload): Promise<RegisterFamilyResponse> {
  const response = await fetch(buildApiUrl("/api/auth/register-family"), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(" ")
      : data?.message ?? "Impossible de créer l'espace famille pour le moment.";
    throw new Error(message);
  }

  return data as RegisterFamilyResponse;
}
