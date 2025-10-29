import { useQuery } from "@tanstack/react-query";

import { getSales, GetSalesFilters, GetSalesParams } from "@/actions/get-sales";

export function getSalesQueryKey(params?: GetSalesParams) {
  return ["sales", params ?? {}] as const;
}

export function useSales(params?: GetSalesParams) {
  return useQuery({
    queryKey: getSalesQueryKey(params),
    queryFn: () => getSales(params),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}


