import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateUserRole } from "@/actions/update-user-role";
import { getUsersQueryKey } from "@/hooks/queries/use-users";

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getUsersQueryKey() });
      toast.success("Nível de acesso atualizado");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar nível de acesso");
    },
  });
}


