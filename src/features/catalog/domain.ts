export const publicDropStates = ["UPCOMING", "AVAILABLE", "ENDED"] as const;

export type PublicDropState = (typeof publicDropStates)[number];

type DropWindow = {
  startsAt: Date;
  endsAt: Date;
};

export function getPublicDropState(
  drop: DropWindow,
  now = new Date(),
): PublicDropState {
  if (now.getTime() < drop.startsAt.getTime()) {
    return "UPCOMING";
  }

  if (now.getTime() < drop.endsAt.getTime()) {
    return "AVAILABLE";
  }

  return "ENDED";
}

export function getPublicPrice(
  state: PublicDropState,
  priceCents: number,
  compareAtPriceCents: number | null,
) {
  if (state !== "AVAILABLE") {
    return null;
  }

  return { priceCents, compareAtPriceCents };
}

export function comparePublicDrops(
  left: DropWindow & { state: PublicDropState; isPrimary: boolean },
  right: DropWindow & { state: PublicDropState; isPrimary: boolean },
) {
  const stateOrder: Record<PublicDropState, number> = {
    AVAILABLE: 0,
    UPCOMING: 1,
    ENDED: 2,
  };
  const stateDifference = stateOrder[left.state] - stateOrder[right.state];

  if (stateDifference !== 0) return stateDifference;
  if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;

  if (left.state === "ENDED") {
    return right.endsAt.getTime() - left.endsAt.getTime();
  }

  const leftRelevantDate =
    left.state === "UPCOMING" ? left.startsAt : left.endsAt;
  const rightRelevantDate =
    right.state === "UPCOMING" ? right.startsAt : right.endsAt;

  return leftRelevantDate.getTime() - rightRelevantDate.getTime();
}

export function formatMoney(priceCents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(priceCents / 100);
}

export function formatDropDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export const dropStateLabels: Record<PublicDropState, string> = {
  UPCOMING: "Próximo drop",
  AVAILABLE: "Disponible ahora",
  ENDED: "Drop finalizado",
};
