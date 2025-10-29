import { useQuery } from "@tanstack/react-query";

import { getSalesDashboard, SalesDashboardParams } from "@/actions/get-sales-dashboard";

export function getSalesDashboardQueryKey(params?: SalesDashboardParams) {
  return ["sales-dashboard", params ?? {}] as const;
}

export function useSalesDashboard(params?: SalesDashboardParams) {
  return useQuery({
    queryKey: getSalesDashboardQueryKey(params),
    queryFn: () => getSalesDashboard(params),
    refetchOnWindowFocus: true,
  });
}


