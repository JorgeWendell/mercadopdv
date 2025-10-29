import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateUser } from "@/actions/update-user";
import { getUsersQueryKey } from "@/hooks/queries/use-users";

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getUsersQueryKey() });
      toast.success("Usuário atualizado");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar usuário");
    },
  });
}


