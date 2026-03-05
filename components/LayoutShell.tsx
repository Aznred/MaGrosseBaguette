"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { PersistLoader } from "@/components/PersistLoader";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/ingredients", label: "Ingrédients" },
  { href: "/generateur", label: "Générateur" },
  { href: "/planificateur", label: "Planificateur" },
  { href: "/shopping-list", label: "Liste de courses" },
  { href: "/analytics", label: "Analyste" },
  { href: "/compta", label: "Comptabilité" },
];

export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-900">
      <PersistLoader />
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200/80 bg-white px-5 py-6 shadow-sm md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-md">
            M
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">
              Ma Verge
            </div>
            <div className="text-xs text-slate-500">
              Coûts & menus
            </div>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-slate-50 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-500">
          Coût menu{" "}
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">
            ≤ 3€
          </span>{" "}
          recommandé.
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <div className="min-h-0 flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </div>
      </main>

      {/* Navigation mobile (bas d'écran) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200/80 bg-white/95 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm safe-area-pb md:hidden"
        aria-label="Navigation principale"
      >
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[44px] flex-1 items-center justify-center rounded-lg px-2 py-2 text-xs font-medium transition ${
                active
                  ? "bg-slate-900 text-slate-50"
                  : "text-slate-600 active:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
