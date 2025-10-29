import { useQuery } from "@tanstack/react-query";

import { getPurchases } from "@/actions/get-purchases";

export function getPurchasesQueryKey() {
  return ["purchases"] as const;
}

export function usePurchases() {
  return useQuery({
    queryKey: getPurchasesQueryKey(),
    queryFn: getPurchases,
  });
}

