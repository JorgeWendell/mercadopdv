import { useQuery } from "@tanstack/react-query";
import { getExpiringProducts } from "@/actions/get-expiring-products";

export function useExpiringProducts(daysThreshold: number = 30) {
  return useQuery({
    queryKey: ["expiring-products", daysThreshold],
    queryFn: () => getExpiringProducts(daysThreshold),
    refetchInterval: 60000,
  });
}

