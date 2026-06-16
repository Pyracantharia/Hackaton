import type { DashboardMemberProfileType } from "./api/types";

export function getProfileVisual(profileType: DashboardMemberProfileType) {
  switch (profileType) {
    case "MANAGER":
      return "/assets/illustrations/businessman-with-briefcase.png";
    case "YOUNG":
      return "/assets/illustrations/young-girl-waving.png";
    case "SENIOR":
      return "/assets/illustrations/senior-woman-with-handbag.png";
    default:
      return "/assets/illustrations/station-agent-standing.png";
  }
}

export function getIntentVisual(intent: "family" | "personal" | "discount" | "helper") {
  switch (intent) {
    case "family":
      return "/assets/logos/pictogrammes/family-pictogram.png";
    case "personal":
      return "/assets/illustrations/navigo-card-vertical.png";
    case "discount":
      return "/assets/logos/pictogrammes/liberte-plus-card.png";
    case "helper":
      return "/assets/illustrations/station-agent-standing.png";
  }
}

export function getAddMemberVisual(profileType: "young" | "senior" | "partner" | "caregiver" | "student" | "discount") {
  switch (profileType) {
    case "young":
      return "/assets/illustrations/young-girl-waving.png";
    case "senior":
      return "/assets/illustrations/senior-woman-with-cane.png";
    case "partner":
      return "/assets/illustrations/businessman-with-briefcase.png";
    case "caregiver":
      return "/assets/illustrations/station-agent-standing.png";
    case "student":
      return "/assets/illustrations/young-woman-backpack.png";
    case "discount":
      return "/assets/logos/pictogrammes/liberte-plus-card.png";
  }
}
