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
    <div className="flex min-h-screen min-h-[100dvh] bg-[linear-gradient(165deg,_#fafaf9_0%,_#f5f5f4_50%,_#fafaf9_100%)] text-stone-900">
      <PersistLoader />
      {/* Sidebar desktop */}
      <aside className="hidden w-72 flex-shrink-0 flex-col md:flex">
        <div className="flex h-full flex-col rounded-r-3xl border border-l-0 border-stone-200/80 bg-white/95 px-6 py-8 shadow-xl shadow-stone-900/5 backdrop-blur-sm">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/30">
              M
            </div>
            <div>
              <div className="font-heading text-xl font-bold tracking-tight text-stone-900">
                Ma Verge
              </div>
              <div className="text-xs font-medium text-stone-500">
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
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-stone-900 text-white shadow-md"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4">
            <p className="text-xs font-medium text-stone-600">
              Objectif coût menu
            </p>
            <p className="mt-1 font-heading text-lg font-bold text-emerald-700">
              ≤ 3€
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              recommandé pour la marge
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col pb-28 md:pb-0 safe-area-pt">
        <div className="min-h-0 flex-1 px-4 py-5 safe-area-x sm:px-6 sm:py-8 md:px-10 md:py-10">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </div>
      </main>

      {/* Navigation mobile : 7 liens, zone tactile 48px, safe area */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around gap-0.5 border-t border-stone-200/90 bg-white/95 px-1 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md safe-area-pb safe-area-x md:hidden"
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
              className={`flex min-h-[48px] min-w-0 flex-1 items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold leading-tight transition-all touch-manipulation active:scale-[0.98] ${
                active
                  ? "bg-stone-900 text-white shadow-inner"
                  : "text-stone-600 active:bg-stone-100"
              }`}
            >
              <span className="truncate text-center">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
