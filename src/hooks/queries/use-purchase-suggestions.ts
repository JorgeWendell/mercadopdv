import { useQuery } from "@tanstack/react-query";
import { getPurchaseSuggestions } from "@/actions/get-purchase-suggestions";

interface UsePurchaseSuggestionsParams {
  categoryId?: string;
  supplierId?: string;
}

export function usePurchaseSuggestions(params: UsePurchaseSuggestionsParams) {
  return useQuery({
    queryKey: ["purchase-suggestions", params],
    queryFn: () => getPurchaseSuggestions(params),
  });
}

