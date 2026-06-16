import { buildApiUrl } from "../api";

export type HouseholdMember = {
  id: string;
  firstName: string;
  lastName: string;
  relationship: "SELF" | "CHILD" | "RELATIVE";
  isHolder: boolean;
  isPayer: boolean;
  isLegalRepresentative: boolean;
};

export type Household = {
  id: string;
  name: string;
  members: HouseholdMember[];
};

export async function getMyHousehold(accessToken: string): Promise<Household> {
  const response = await fetch(buildApiUrl("/api/households/me"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer l'espace famille.");
  }

  return response.json() as Promise<Household>;
}
