import assert from "node:assert/strict";
import test from "node:test";

import {
  comparePublicDrops,
  getPublicDropState,
  getPublicPrice,
} from "./domain";

const startsAt = new Date("2026-09-01T10:00:00.000Z");
const endsAt = new Date("2026-09-08T10:00:00.000Z");

test("calcula los tres estados públicos y sus límites exactos", () => {
  const drop = { startsAt, endsAt };

  assert.equal(
    getPublicDropState(drop, new Date("2026-09-01T09:59:59.999Z")),
    "UPCOMING",
  );
  assert.equal(getPublicDropState(drop, startsAt), "AVAILABLE");
  assert.equal(
    getPublicDropState(drop, new Date("2026-09-08T09:59:59.999Z")),
    "AVAILABLE",
  );
  assert.equal(getPublicDropState(drop, endsAt), "ENDED");
});

test("no expone ningún precio antes de que abra el drop", () => {
  assert.equal(getPublicPrice("UPCOMING", 3_197, 3_500), null);
  assert.deepEqual(getPublicPrice("AVAILABLE", 3_197, 3_500), {
    priceCents: 3_197,
    compareAtPriceCents: 3_500,
  });
  assert.equal(getPublicPrice("ENDED", 3_197, 3_500), null);
});

test("ordena disponible, próximo y finalizado antes de aplicar fechas", () => {
  const base = { startsAt, endsAt, isPrimary: false };
  const drops = [
    { ...base, state: "ENDED" as const },
    { ...base, state: "UPCOMING" as const },
    { ...base, state: "AVAILABLE" as const },
  ];

  assert.deepEqual(
    drops.sort(comparePublicDrops).map(({ state }) => state),
    ["AVAILABLE", "UPCOMING", "ENDED"],
  );
});
