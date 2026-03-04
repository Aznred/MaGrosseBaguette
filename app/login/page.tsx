"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">
            S
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold text-slate-900">
          Sandwich Planner
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Connectez-vous avec votre compte Forge EPITA pour accéder à
          l&apos;application.
        </p>
        <button
          type="button"
          onClick={() => signIn("forge-epita", { callbackUrl })}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
        >
          Se connecter avec Forge EPITA
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">
          Seuls les comptes autorisés peuvent accéder aux données.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-100">
        <div className="text-sm text-slate-500">Chargement…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
