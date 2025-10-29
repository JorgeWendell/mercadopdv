import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createProduct } from "@/actions/create-product";

export function getCreateProductMutationKey() {
  return ["create-product"] as const;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getCreateProductMutationKey(),
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar produto");
    },
  });
}
