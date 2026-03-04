"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AccessDeniedPage() {
  const [forgeSub, setForgeSub] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => d.forgeSub && setForgeSub(d.forgeSub))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <span className="text-xl" aria-hidden>⚠</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Accès refusé
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Votre compte Forge EPITA n&apos;a pas les droits pour accéder à cette
          application. Contactez un administrateur pour demander l&apos;accès.
        </p>
        {forgeSub && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 break-all">
            Identifiant Forge à communiquer à l&apos;admin : <strong>{forgeSub}</strong>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Se déconnecter
          </button>
          <Link
            href="/login"
            className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
