"use client";

import { useActionState } from "react";

import { beginAdminLogin, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    beginAdminLogin,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="email"
          className="font-heading text-sm font-bold uppercase tracking-wide text-white"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          className="mt-2 min-h-12 w-full border border-white/20 bg-[#07101d] px-4 text-white placeholder:text-white/35 focus:border-brand-gold focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="font-heading text-sm font-bold uppercase tracking-wide text-white"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 min-h-12 w-full border border-white/20 bg-[#07101d] px-4 text-white focus:border-brand-gold focus:outline-none"
        />
      </div>
      {state.error ? (
        <p role="alert" className="border-l-2 border-rose-400 pl-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center border border-brand-gold bg-brand-gold px-6 font-heading text-base font-bold uppercase tracking-[0.12em] text-brand-panel hover:bg-[#ffe19a] disabled:cursor-wait disabled:opacity-65"
      >
        {pending ? "Comprobando..." : "Continuar"}
      </button>
    </form>
  );
}
