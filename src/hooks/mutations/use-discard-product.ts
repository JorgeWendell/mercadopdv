import { useMutation, useQueryClient } from "@tanstack/react-query";
import { discardProduct } from "@/actions/discard-product";
import type { DiscardProductInput } from "@/actions/discard-product/schema";

export function useDiscardProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DiscardProductInput) => discardProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expiring-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["discards"] });
    },
  });
}

