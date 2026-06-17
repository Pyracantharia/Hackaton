import type { OfferProductType } from "./api/types";

export function getOfferVisual(productType: OfferProductType) {
  switch (productType) {
    case "IMAGINE_R_JUNIOR":
    case "IMAGINE_R_SCHOOL":
    case "IMAGINE_R_STUDENT":
      return "/assets/logos/pictogrammes/weekly-pass-card.png";
    case "NAVIGO_SENIOR":
    case "AMETHYSTE":
      return "/assets/logos/pictogrammes/senior-pass-card.png";
    case "NAVIGO_LIBERTE":
      return "/assets/logos/pictogrammes/liberte-plus-card.png";
    case "NAVIGO_ANNUAL":
      return "/assets/illustrations/navigo-card-vertical.png";
    default:
      return "/assets/logos/pictogrammes/generic-pass-card.png";
  }
}
