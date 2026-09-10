"use client";

import type { Payment } from "@/types";
import { useLocalStorage } from "./use-local-storage";

const KEY = "nirvona.orders";

/**
 * Orders created during this prototype session. A real build reads these from
 * the API; keeping them here lets the payment → receipt → dashboard flow work
 * end to end without a backend.
 */
export function useOrders() {
  const { value, setValue, hydrated } = useLocalStorage<Payment[]>(KEY, []);

  return {
    orders: value,
    hydrated,
    addOrder: (order: Payment) => setValue((prev) => [order, ...prev.filter((p) => p.id !== order.id)]),
    getOrder: (id: string) => value.find((order) => order.id === id),
  };
}
