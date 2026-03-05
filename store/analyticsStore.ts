"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuOrder } from "@/lib/types/analytics";

const STORAGE_KEY = "sandwich-planner-menu-orders";

interface AnalyticsState {
  menuOrders: MenuOrder[];
  addMenuOrder: (order: Omit<MenuOrder, "id" | "date">) => void;
  addMenuOrders: (orders: Omit<MenuOrder, "id" | "date">[]) => void;
  clearOrders: () => void;
  setMenuOrders: (orders: MenuOrder[]) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      menuOrders: [],
      addMenuOrder: (order) =>
        set((state) => ({
          menuOrders: [
            ...state.menuOrders,
            {
              ...order,
              id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              date: new Date().toISOString(),
            },
          ],
        })),
      addMenuOrders: (orders) =>
        set((state) => ({
          menuOrders: [
            ...state.menuOrders,
            ...orders.map((o) => ({
              ...o,
              id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              date: new Date().toISOString(),
            })),
          ],
        })),
      clearOrders: () => set({ menuOrders: [] }),
      setMenuOrders: (orders) => set({ menuOrders: orders }),
    }),
    { name: STORAGE_KEY }
  )
);
