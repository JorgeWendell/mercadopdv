import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCategory } from "@/actions/create-category";

export function getCreateCategoryMutationKey() {
  return ["create-category"] as const;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getCreateCategoryMutationKey(),
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar categoria");
    },
  });
}
