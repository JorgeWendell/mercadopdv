"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { inventoryStart } from "@/actions/inventory-start";
import { inventorySubmitCount } from "@/actions/inventory-submit-count";
import { inventoryFinalize } from "@/actions/inventory-finalize";
import { inventorySessionKey } from "@/hooks/queries/use-inventory-session";

export function useInventoryStart() {
  return useMutation({
    mutationKey: ["inventory-start"],
    mutationFn: inventoryStart,
    onError: (e: any) => {
      const msg = e?.message ?? "Erro ao iniciar inventário";
      toast.error(msg);
    },
  });
}

export function useInventorySubmitCount(sessionId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["inventory-submit"],
    mutationFn: inventorySubmitCount,
    onSuccess: () => {
      toast.success("Contagem registrada");
      if (sessionId) void qc.invalidateQueries({ queryKey: inventorySessionKey(sessionId) });
    },
    onError: (e: any) => {
      const msg = e?.message ?? "Erro ao salvar contagem";
      toast.error(msg);
    },
  });
}

export function useInventoryFinalize(sessionId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["inventory-finalize"],
    mutationFn: inventoryFinalize,
    onSuccess: () => {
      toast.success("Inventário finalizado");
      if (sessionId) void qc.invalidateQueries({ queryKey: inventorySessionKey(sessionId) });
    },
    onError: (e: any) => {
      const msg = e?.message ?? "Erro ao finalizar inventário";
      toast.error(msg);
    },
  });
}


