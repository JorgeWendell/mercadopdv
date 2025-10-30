import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPurchaseFromNFe } from "@/actions/create-purchase-from-nfe";
import type { CreatePurchaseFromNFeInput } from "@/actions/create-purchase-from-nfe/schema";

export function useCreatePurchaseFromNFe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePurchaseFromNFeInput) => createPurchaseFromNFe(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

