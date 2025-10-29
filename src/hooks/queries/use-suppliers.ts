import { useQuery } from "@tanstack/react-query";

import { getSuppliers } from "@/actions/get-suppliers";

export function getSuppliersQueryKey() {
  return ["suppliers"] as const;
}

export function useSuppliers() {
  return useQuery({
    queryKey: getSuppliersQueryKey(),
    queryFn: getSuppliers,
  });
}

