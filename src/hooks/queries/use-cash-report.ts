"use client";

import { useQuery } from "@tanstack/react-query";
import { getCashReport } from "@/actions/get-cash-report";

export const cashReportKey = (start?: Date, end?: Date) => [
  "cash-report",
  start ? start.toISOString() : null,
  end ? end.toISOString() : null,
] as const;

export function useCashReport(params: { start?: Date; end?: Date }) {
  return useQuery({
    queryKey: cashReportKey(params.start, params.end),
    queryFn: async () => await getCashReport({ start: params.start as Date, end: params.end as Date }),
    enabled: Boolean(params.start && params.end),
  });
}


