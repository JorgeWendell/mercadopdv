"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { closeCash } from "@/actions/close-cash";
import { cashStatusQueryKey } from "@/hooks/queries/use-cash-status";

export const closeCashMutationKey = () => ["close-cash"] as const;

export function useCloseCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: closeCashMutationKey(),
    mutationFn: closeCash,
    onSuccess: () => {
      toast.success("Caixa fechado");
      void qc.invalidateQueries({ queryKey: cashStatusQueryKey() });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao fechar caixa"),
  });
}


