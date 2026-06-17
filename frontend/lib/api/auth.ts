import { buildApiUrl } from "../api";
import type { LoginPayload, LoginResponse, RegisterFamilyPayload, RegisterFamilyResponse } from "./types";

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = Array.isArray(data?.message)
    ? data.message.join(" ")
    : data?.message ?? "Le service est momentanément indisponible.";

  return message;
}

function shouldRetryWithLegacyRegisterPayload(message: string) {
  return message.includes("property members should not exist") || message.includes("child must be an object");
}

function buildLegacyRegisterPayload(payload: RegisterFamilyPayload) {
  const youngMember = payload.members.find((member) => member.type === "YOUNG");

  if (!youngMember) return null;

  return {
    consents: payload.consents,
    parent: payload.parent,
    roles: payload.roles,
    verification: payload.verification,
    child: {
      birthDate: youngMember.birthDate,
      department: youngMember.department,
      firstName: youngMember.firstName,
      lastName: youngMember.lastName,
      schoolLevel: youngMember.schoolLevel ?? "OTHER",
    },
  };
}

async function postRegisterFamily(payload: unknown) {
  return fetch(buildApiUrl("/api/auth/register-family"), {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
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
    response = await postRegisterFamily(payload);
  } catch {
    throw new Error("Impossible de joindre le service d'inscription. Vérifiez que le backend est démarré.");
  }
  
  if (!response.ok) {
    const message = await parseApiError(response);
    const legacyPayload = shouldRetryWithLegacyRegisterPayload(message) ? buildLegacyRegisterPayload(payload) : null;

    if (legacyPayload) {
      const retryResponse = await postRegisterFamily(legacyPayload);

      if (retryResponse.ok) {
        return retryResponse.json() as Promise<RegisterFamilyResponse>;
      }

      throw new Error(await parseApiError(retryResponse));
    }

    throw new Error(message);
  }

  return response.json() as Promise<RegisterFamilyResponse>;
}
