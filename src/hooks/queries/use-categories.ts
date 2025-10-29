import { useQuery } from "@tanstack/react-query";

import { getCategories } from "@/actions/get-categories";

export function getCategoriesQueryKey() {
  return ["categories"] as const;
}

export function useCategories() {
  return useQuery({
    queryKey: getCategoriesQueryKey(),
    queryFn: getCategories,
  });
}
