"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { openCash } from "@/actions/open-cash";
import { cashStatusQueryKey } from "@/hooks/queries/use-cash-status";

export const openCashMutationKey = () => ["open-cash"] as const;

export function useOpenCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: openCashMutationKey(),
    mutationFn: openCash,
    onSuccess: () => {
      toast.success("Caixa aberto");
      void qc.invalidateQueries({ queryKey: cashStatusQueryKey() });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao abrir caixa"),
  });
}


