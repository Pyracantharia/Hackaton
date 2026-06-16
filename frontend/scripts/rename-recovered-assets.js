/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "public", "assets");

const renames = {
  "illustrations/IDFM_0034448_IDFM_ORI.png": "illustrations/ticket-validation-gate.png",
  "illustrations/IDFM_0034449_IDFM_ORI.png": "illustrations/station-waiting-area.png",
  "illustrations/IDFM_0034450_IDFM_ORI.png": "illustrations/navigo-card-and-paper-tickets.png",
  "illustrations/IDFM_0034451_IDFM_ORI.png": "illustrations/ticket-vending-machines.png",
  "illustrations/IDFM_0034452_IDFM_ORI.png": "illustrations/station-entrance-arch.png",
  "illustrations/IDFM_0034453_IDFM_ORI.png": "illustrations/city-bus-side-view.png",
  "illustrations/IDFM_0034454_IDFM_ORI.png": "illustrations/cable-car-gondola.png",
  "illustrations/IDFM_0034457_IDFM_ORI.png": "illustrations/metro-train-side-view.png",
  "illustrations/IDFM_0034458_IDFM_ORI.png": "illustrations/historic-station-building.png",
  "illustrations/IDFM_0034459_IDFM_ORI.png": "illustrations/service-kiosk-terminal.png",
  "illustrations/IDFM_0034460_IDFM_ORI.png": "illustrations/hand-holding-ticket.png",
  "illustrations/IDFM_0034461_IDFM_ORI.png": "illustrations/hand-tapping-contactless.png",
  "illustrations/IDFM_0034463_IDFM_ORI.png": "illustrations/rer-train-side-view.png",
  "illustrations/IDFM_0034464_IDFM_ORI.png": "illustrations/light-rail-side-view.png",
  "illustrations/IDFM_0034465_IDFM_ORI.png": "illustrations/transit-stop-building.png",
  "illustrations/IDFM_0034466_IDFM_ORI.png": "illustrations/bus-depot-garage.png",
  "illustrations/IDFM_0034467_IDFM_ORI.png": "illustrations/bicycle-parking-rack.png",
  "illustrations/IDFM_0034471_IDFM_ORI.png": "illustrations/navigo-card-vertical.png",
  "illustrations/IDFM_0034472_IDFM_ORI.png": "illustrations/station-agent-standing.png",
  "illustrations/IDFM_0034473_IDFM_ORI.png": "illustrations/male-commuter-standing.png",
  "illustrations/IDFM_0034474_IDFM_ORI.png": "illustrations/transit-inspectors-duo.png",
  "illustrations/IDFM_0034475_IDFM_ORI.png": "illustrations/young-girl-waving.png",
  "illustrations/IDFM_0034476_IDFM_ORI.png": "illustrations/young-woman-backpack.png",
  "illustrations/IDFM_0034477_IDFM_ORI.png": "illustrations/woman-orange-shirt-standing.png",
  "illustrations/IDFM_0034478_IDFM_ORI.png": "illustrations/woman-white-shirt-standing.png",
  "illustrations/IDFM_0034479_IDFM_ORI.png": "illustrations/senior-woman-with-handbag.png",
  "illustrations/IDFM_0034480_IDFM_ORI.png": "illustrations/senior-woman-with-cane.png",
  "illustrations/IDFM_0034481_IDFM_ORI.png": "illustrations/woman-pink-top-standing.png",
  "illustrations/IDFM_0034482_IDFM_ORI.png": "illustrations/wheelchair-user-with-phone.png",
  "illustrations/IDFM_0034483_IDFM_ORI.png": "illustrations/blonde-woman-standing.png",
  "illustrations/IDFM_0034484_IDFM_ORI.png": "illustrations/woman-green-shirt-standing.png",
  "illustrations/IDFM_0034485_IDFM_ORI.png": "illustrations/young-person-orange-armbands.png",
  "illustrations/IDFM_0034486_IDFM_ORI.png": "illustrations/businessman-with-briefcase.png",
  "illustrations/IDFM_0034487_IDFM_ORI.png": "illustrations/senior-man-with-cap.png",
  "illustrations/IDFM_0034488_IDFM_ORI.png": "illustrations/wheelchair-user-purple-shirt.png",
  "illustrations/IDFM_0034489_IDFM_ORI.png": "illustrations/traveler-with-suitcase.png",
  "illustrations/IDFM_0034490_IDFM_ORI.png": "illustrations/man-peach-shirt-standing.png",
  "illustrations/IDFM_0034491_IDFM_ORI.png": "illustrations/station-staff-high-five.png",
  "illustrations/IDFM_0034493_IDFM_ORI.png": "illustrations/long-commuter-train-side-view.png",
  "illustrations/IDFM_0034494_IDFM_ORI.png": "illustrations/modern-station-entrance.png",
  "illustrations/IDFM_0034495_IDFM_ORI.png": "illustrations/printed-transit-ticket.png",
  "illustrations/IDFM_0034496_IDFM_ORI.svg": "illustrations/eiffel-tower.svg",
  "illustrations/IDFM_0034497_IDFM_ORI.png": "illustrations/metro-train-front-view.png",
  "illustrations/IDFM_0034498_IDFM_ORI.png": "illustrations/contactless-validator-round.png",
  "illustrations/IDFM_0034499_IDFM_ORI.png": "illustrations/cyclist-with-front-basket.png",
  "illustrations/IDFM_0034500_IDFM_ORI.jpg": "illustrations/bicycle-with-front-basket.jpg",
  "illustrations/IDFM_0034501_IDFM_ORI.jpg": "illustrations/road-bike.jpg",
  "illustrations/IDFM_0034502_IDFM_ORI.png": "illustrations/blue-compact-car.png",
  "logos/IDFM_0034286_IDFM.png": "logos/idfm-logo-with-wordmark-and-symbol.png",
  "logos/IDFM_0034287_IDFM.png": "logos/idfm-wordmark-with-symbol.png",
  "logos/IDFM_0034288_IDFM.png": "logos/idfm-symbol-only.png",
  "logos/IDFM_0034290_IDFM.png": "logos/idfm-logo-horizontal.png",
  "logos/IDFM_0034291_IDFM.png": "logos/idfm-wordmark-horizontal.png",
  "logos/IDFM_0034292_IDFM.png": "logos/idfm-symbol-small.png",
  "logos/IDFM_0034293_IDFM.png": "logos/idfm-pattern-strip.png",
  "logos/pictogrammes/IDFM_0040015_IDFM_ORI.png": "logos/pictogrammes/wheelchair-accessibility-icon.png",
  "logos/pictogrammes/IDFM_0040018_IDFM_ORI.png": "logos/pictogrammes/family-pictogram.png",
  "logos/pictogrammes/IDFM_0040028_IDFM_ORI.png": "logos/pictogrammes/walking-person-pictogram.png",
  "logos/pictogrammes/IDFM_0040069_IDFM_ORI.png": "logos/pictogrammes/weekly-pass-card.png",
  "logos/pictogrammes/IDFM_0040070_IDFM_ORI.png": "logos/pictogrammes/daily-pass-card.png",
  "logos/pictogrammes/IDFM_0040071_IDFM_ORI.png": "logos/pictogrammes/senior-pass-card.png",
  "logos/pictogrammes/IDFM_0040072_IDFM_ORI.png": "logos/pictogrammes/liberte-plus-card.png",
  "logos/pictogrammes/IDFM_0040073_IDFM_ORI.png": "logos/pictogrammes/generic-pass-card.png",
  "logos/pictogrammes/IDFM_0040075_IDFM_ORI.png": "logos/pictogrammes/user-profile-pictogram.png",
};

for (const [fromRelative, toRelative] of Object.entries(renames)) {
  const from = path.join(root, fromRelative);
  const to = path.join(root, toRelative);

  if (!fs.existsSync(from)) {
    console.warn(`skip missing: ${fromRelative}`);
    continue;
  }

  if (fs.existsSync(to)) {
    console.warn(`skip existing target: ${toRelative}`);
    continue;
  }

  fs.renameSync(from, to);
  console.log(`${fromRelative} -> ${toRelative}`);
}
