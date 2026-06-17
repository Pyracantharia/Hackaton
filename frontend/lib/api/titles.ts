import { buildApiUrl } from "../api";
import type {
  OfferProductType,
  OfferTargetProfile,
  ProductOffer,
  ProductOfferDetail,
  TitleRecommendationPayload,
  TitleRecommendationResponse,
} from "./types";

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => null);
  const message = Array.isArray(data?.message)
    ? data.message.join(" ")
    : data?.message ?? "Le service est momentanement indisponible.";

  return message;
}

export async function getTitleOffers(filters: {
  profileType?: string;
  targetProfile?: OfferTargetProfile;
  productType?: OfferProductType;
} = {}): Promise<ProductOffer[]> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  const response = await fetch(buildApiUrl(`/api/titles/offers${query ? `?${query}` : ""}`));

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<ProductOffer[]>;
}

export async function getTitleOfferDetail(slug: string): Promise<ProductOfferDetail> {
  const response = await fetch(buildApiUrl(`/api/titles/offers/${slug}`));

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<ProductOfferDetail>;
}

export async function recommendTitle(
  accessToken: string,
  payload: TitleRecommendationPayload,
): Promise<TitleRecommendationResponse> {
  const response = await fetch(buildApiUrl("/api/titles/recommend"), {
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

  return response.json() as Promise<TitleRecommendationResponse>;
}
