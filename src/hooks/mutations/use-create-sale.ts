import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createSale } from "@/actions/create-sale";
import { getProductsQueryKey } from "@/hooks/queries/use-products";

export function getCreateSaleMutationKey() {
  return ["create-sale"] as const;
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getCreateSaleMutationKey(),
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda realizada com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao finalizar venda");
    },
  });
}

