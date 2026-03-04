"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { LayoutShell } from "@/components/LayoutShell";

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/access-denied";
  return (
    <SessionProvider>
      {isAuthPage ? children : <LayoutShell>{children}</LayoutShell>}
    </SessionProvider>
  );
}
