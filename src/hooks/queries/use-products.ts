import { useQuery } from "@tanstack/react-query";

import { getProducts } from "@/actions/get-products";

export function getProductsQueryKey() {
  return ["products"] as const;
}

export function useProducts() {
  return useQuery({
    queryKey: getProductsQueryKey(),
    queryFn: getProducts,
  });
}
