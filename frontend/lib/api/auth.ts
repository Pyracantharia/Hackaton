import { buildApiUrl } from "../api";
import type { LoginPayload, LoginResponse, RegisterFamilyPayload, RegisterFamilyResponse } from "./types";

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = Array.isArray(data?.message)
    ? data.message.join(" ")
    : data?.message ?? "Le service est momentanément indisponible.";

  return message;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/auth/login"), {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    throw new Error("Impossible de joindre le service de connexion. Vérifiez que le backend est démarré.");
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<LoginResponse>;
}

export async function registerFamily(payload: RegisterFamilyPayload): Promise<RegisterFamilyResponse> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/auth/register-family"), {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    throw new Error("Impossible de joindre le service d'inscription. Vérifiez que le backend est démarré.");
  }
  
  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<RegisterFamilyResponse>;
}
