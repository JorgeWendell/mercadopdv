"use client";

import { useQuery } from "@tanstack/react-query";
import { getCashStatus } from "@/actions/get-cash-status";

export const cashStatusQueryKey = (start?: Date, end?: Date) => ["cash-status", start?.toISOString() ?? null, end?.toISOString() ?? null] as const;

export function useCashStatus(params?: { start?: Date; end?: Date }) {
  return useQuery({
    queryKey: cashStatusQueryKey(params?.start, params?.end),
    queryFn: async () => await getCashStatus(params),
    refetchOnWindowFocus: true,
  });
}


