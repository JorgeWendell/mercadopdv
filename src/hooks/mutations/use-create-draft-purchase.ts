import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDraftPurchase } from "@/actions/create-draft-purchase";
import type { CreateDraftPurchaseInput } from "@/actions/create-draft-purchase/schema";

export function useCreateDraftPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDraftPurchaseInput) => createDraftPurchase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

