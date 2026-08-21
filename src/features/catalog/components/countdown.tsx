"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDropDate, type PublicDropState } from "../domain";

const hourInMilliseconds = 60 * 60 * 1_000;
const dayInMilliseconds = 24 * hourInMilliseconds;

function remainingLabel(
  milliseconds: number,
  state: Extract<PublicDropState, "UPCOMING" | "AVAILABLE">,
) {
  if (milliseconds <= 0) {
    return state === "UPCOMING" ? "Ya está disponible" : "El drop ha finalizado";
  }

  if (milliseconds > 48 * hourInMilliseconds) {
    const days = Math.ceil(milliseconds / dayInMilliseconds);
    return `${days} ${days === 1 ? "día" : "días"}`;
  }

  const hours = Math.floor(milliseconds / hourInMilliseconds);
  const minutes = Math.max(
    0,
    Math.floor((milliseconds % hourInMilliseconds) / 60_000),
  );
  return `${hours} h ${minutes} min`;
}

export function Countdown({
  state,
  target,
  initialNow,
}: {
  state: Extract<PublicDropState, "UPCOMING" | "AVAILABLE">;
  target: string;
  initialNow: string;
}) {
  const targetTime = useMemo(() => new Date(target).getTime(), [target]);
  const [now, setNow] = useState(() => new Date(initialNow).getTime());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="border-l-2 border-brand-gold pl-4">
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.17em] text-white/58">
        {state === "UPCOMING" ? "Disponible en" : "Termina en"}
      </p>
      <p
        aria-live="polite"
        className="mt-1 font-display text-4xl tracking-wide text-brand-gold"
      >
        {remainingLabel(targetTime - now, state)}
      </p>
      <p className="mt-1 text-sm text-white/60">{formatDropDate(target)}</p>
    </div>
  );
}
