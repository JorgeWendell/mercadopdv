import { useQuery } from "@tanstack/react-query";

import { getCustomers } from "@/actions/get-customers";

export function getCustomersQueryKey() {
  return ["customers"] as const;
}

export function useCustomers() {
  return useQuery({
    queryKey: getCustomersQueryKey(),
    queryFn: getCustomers,
  });
}
