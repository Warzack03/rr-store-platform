"use client";

import { useActionState } from "react";

import { completeAdminLogin, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null };

export function TwoFactorForm({ setup }: { setup: boolean }) {
  const [state, formAction, pending] = useActionState(
    completeAdminLogin,
    initialState,
  );

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <div>
        <label
          htmlFor="code"
          className="font-heading text-sm font-bold uppercase tracking-wide text-white"
        >
          {setup ? "Código de 6 dígitos" : "Código o clave de recuperación"}
        </label>
        <input
          id="code"
          name="code"
          type="text"
          autoComplete="one-time-code"
          inputMode={setup ? "numeric" : "text"}
          pattern={setup ? "[0-9]{6}" : undefined}
          maxLength={32}
          required
          autoFocus
          className="mt-2 min-h-12 w-full border border-white/20 bg-[#07101d] px-4 text-center font-mono text-xl tracking-[0.16em] text-white focus:border-brand-gold focus:outline-none"
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
        {pending ? "Verificando..." : setup ? "Activar y entrar" : "Entrar"}
      </button>
    </form>
  );
}
