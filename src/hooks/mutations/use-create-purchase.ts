import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createPurchase } from "@/actions/create-purchase";
import { getPurchasesQueryKey } from "@/hooks/queries/use-purchases";

export function getCreatePurchaseMutationKey() {
  return ["create-purchase"] as const;
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getCreatePurchaseMutationKey(),
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPurchasesQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Entrada de mercadorias registrada com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar entrada de mercadorias");
    },
  });
}

