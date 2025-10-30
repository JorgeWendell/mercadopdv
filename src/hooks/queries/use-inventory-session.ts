"use client";

import { useQuery } from "@tanstack/react-query";
import { getInventorySession } from "@/actions/get-inventory-session";

export const inventorySessionKey = (id: string) => ["inventory-session", id] as const;

export function useInventorySession(sessionId: string | undefined) {
  return useQuery({
    queryKey: inventorySessionKey(sessionId || ""),
    queryFn: async () => await getInventorySession(sessionId as string),
    enabled: Boolean(sessionId),
  });
}


