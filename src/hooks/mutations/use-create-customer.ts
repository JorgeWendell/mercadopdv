import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCustomer } from "@/actions/create-customer";

export function getCreateCustomerMutationKey() {
  return ["create-customer"] as const;
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getCreateCustomerMutationKey(),
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente criado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });
}
