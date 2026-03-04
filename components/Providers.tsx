"use client";

import { ReactNode } from "react";
import { LayoutShell } from "@/components/LayoutShell";

export function Providers({ children }: { children: ReactNode }) {
  return <LayoutShell>{children}</LayoutShell>;
}
