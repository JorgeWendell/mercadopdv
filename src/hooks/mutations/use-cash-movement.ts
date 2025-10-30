"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCashMovement } from "@/actions/create-cash-movement";
import { cashStatusQueryKey } from "@/hooks/queries/use-cash-status";

export const cashMovementMutationKey = () => ["cash-movement"] as const;

export function useCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: cashMovementMutationKey(),
    mutationFn: createCashMovement,
    onSuccess: () => {
      toast.success("Movimentação registrada");
      void qc.invalidateQueries({ queryKey: cashStatusQueryKey() });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao movimentar caixa"),
  });
}


