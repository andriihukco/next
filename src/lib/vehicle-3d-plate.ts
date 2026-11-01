

/** The DOM plate that follows the selected vehicle: route, plate, and trip ends. */

export function splitTripEnds(destination: string): [string | null, string] {
  const parts = destination.split(" - ");
  if (parts.length < 2) return [null, destination];
  return [parts[0], parts.slice(1).join(" - ")];
}

export function parseColor(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

export type PlateCardStep = { step: HTMLElement; value: HTMLElement };
export type PlateCard = {
  route: HTMLElement;
  start: PlateCardStep;
  next: PlateCardStep;
  end: PlateCardStep;
};

export function setPlateCardStep(step: PlateCardStep, value: string | null): void {
  step.step.hidden = !value;
  step.value.textContent = value ?? "";
}

// The only DOM vehicle element: the trip card of the selected vehicle.
export function createSelectedPlate(onSelect: () => void): {
  plate: HTMLButtonElement;
  plateText: HTMLSpanElement;
  plateCard: PlateCard;
} {
  const plate = document.createElement("button");
  plate.type = "button";
  plate.className = "vehicle-plate selected";
  plate.addEventListener("click", onSelect);

  const main = document.createElement("span");
  main.className = "vehicle-plate-main";
  const flag = document.createElement("b");
  flag.textContent = "UA";
  const plateText = document.createElement("span");
  main.append(flag, plateText);

  const card = document.createElement("span");
  card.className = "vehicle-plate-card";
  const cardRoute = document.createElement("i");
  cardRoute.className = "vehicle-plate-card-route";
  const steps = document.createElement("span");
  steps.className = "vehicle-plate-card-steps";
  const createStep = (icon: string, label: string, modifier?: string): PlateCardStep => {
    const step = document.createElement("span");
    step.className = modifier ? `vehicle-plate-step ${modifier}` : "vehicle-plate-step";
    const glyph = document.createElement("span");
    glyph.className = "material-symbols-rounded";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = icon;
    const text = document.createElement("span");
    text.className = "vehicle-plate-step-text";
    const caption = document.createElement("small");
    caption.textContent = label;
    const value = document.createElement("b");
    text.append(caption, value);
    step.append(glyph, text);
    steps.appendChild(step);
    return { step, value };
  };
  const plateCard: PlateCard = {
    route: cardRoute,
    start: createStep("trip_origin", "Початкова"),
    next: createStep("location_on", "Наступна", "is-next"),
    end: createStep("flag", "Кінцева"),
  };
  card.append(cardRoute, steps);
  plate.append(card, main);
  return { plate, plateText, plateCard };
}
