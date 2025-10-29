import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createSupplier } from "@/actions/create-supplier";

export function getCreateSupplierMutationKey() {
  return ["create-supplier"] as const;
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getCreateSupplierMutationKey(),
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor criado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar fornecedor");
    },
  });
}
