"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useExpiringProducts } from "@/hooks/queries/use-expiring-products";
import { useDiscardProduct } from "@/hooks/mutations/use-discard-product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ValidadesPage() {
  const [daysThreshold, setDaysThreshold] = useState(30);
  const [discardDialog, setDiscardDialog] = useState<{
    open: boolean;
    productId: string | null;
    productName: string;
    maxQty: number;
  }>({ open: false, productId: null, productName: "", maxQty: 0 });
  const [discardQty, setDiscardQty] = useState("");
  const [discardReason, setDiscardReason] = useState<"EXPIRED" | "DAMAGED" | "QUALITY_ISSUE" | "OTHER">("EXPIRED");
  const [discardNotes, setDiscardNotes] = useState("");

  const { data, isLoading } = useExpiringProducts(daysThreshold);
  const discardMutation = useDiscardProduct();

  const products = data?.success ? data.data : [];

  const expired = products.filter((p) => p.isExpired);
  const critical = products.filter((p) => !p.isExpired && p.status === "CRITICAL");
  const warning = products.filter((p) => !p.isExpired && p.status === "WARNING");

  const handleOpenDiscardDialog = (productId: string, productName: string, maxQty: number) => {
    setDiscardDialog({ open: true, productId, productName, maxQty });
    setDiscardQty("");
    setDiscardReason("EXPIRED");
    setDiscardNotes("");
  };

  const handleDiscard = () => {
    if (!discardDialog.productId) return;

    const qty = parseFloat(discardQty.replace(",", "."));
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantidade inválida");
      return;
    }

    if (qty > discardDialog.maxQty) {
      toast.error(`Quantidade máxima: ${discardDialog.maxQty.toFixed(3)}`);
      return;
    }

    discardMutation.mutate(
      {
        productId: discardDialog.productId,
        quantity: qty,
        reason: discardReason,
        notes: discardNotes || undefined,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success("Produto descartado com sucesso!");
            setDiscardDialog({ open: false, productId: null, productName: "", maxQty: 0 });
          } else {
            toast.error(result.message);
          }
        },
      }
    );
  };

  const getStatusBadge = (status: string, isExpired: boolean) => {
    if (isExpired) {
      return (
        <Badge variant="destructive" className="text-xs">
          ❌ Vencido
        </Badge>
      );
    }
    if (status === "CRITICAL") {
      return (
        <Badge variant="destructive" className="text-xs">
          ⚠️ Crítico
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        ⏰ Atenção
      </Badge>
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gestão de Validades</h1>
        <div className="text-sm text-muted-foreground">
          💡 Dica: Para testar, vá em <strong>Entrada de Mercadorias</strong> e preencha os campos de <strong>Lote</strong> e <strong>Data de Validade</strong> ao adicionar um item
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-sm">Exibir produtos que vencem em até:</label>
          <select
            className="border rounded px-2 py-1 block min-w-[150px]"
            value={daysThreshold}
            onChange={(e) => setDaysThreshold(Number(e.target.value))}
          >
            <option value={7}>7 dias</option>
            <option value={15}>15 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4 bg-red-50">
          <div className="text-2xl font-bold text-red-600">{expired.length}</div>
          <div className="text-sm text-muted-foreground">Vencidos</div>
        </div>
        <div className="border rounded p-4 bg-orange-50">
          <div className="text-2xl font-bold text-orange-600">{critical.length}</div>
          <div className="text-sm text-muted-foreground">Críticos (≤ 7 dias)</div>
        </div>
        <div className="border rounded p-4 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-600">{warning.length}</div>
          <div className="text-sm text-muted-foreground">Atenção (8-{daysThreshold} dias)</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Status</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Lote</th>
              <th>Quantidade</th>
              <th>Fabricação</th>
              <th>Validade</th>
              <th>Dias</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-4 text-center text-muted-foreground" colSpan={9}>
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && products.length === 0 && (
              <tr>
                <td className="py-4 text-center text-muted-foreground" colSpan={9}>
                  ✅ Nenhum produto próximo ao vencimento
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className={`border-t hover:bg-muted/50 ${p.isExpired ? "bg-red-50" : ""}`}>
                <td className="py-2">{getStatusBadge(p.status, p.isExpired)}</td>
                <td className="font-medium">{p.productName}</td>
                <td>{p.categoryName}</td>
                <td>{p.batch}</td>
                <td>{p.quantity.toFixed(3)}</td>
                <td>{formatDate(p.manufacturingDate)}</td>
                <td className={p.isExpired ? "text-red-600 font-semibold" : ""}>{formatDate(p.expirationDate)}</td>
                <td
                  className={
                    p.isExpired ? "text-red-600 font-semibold" : p.daysUntilExpiry! <= 7 ? "text-orange-600 font-semibold" : ""
                  }
                >
                  {p.daysUntilExpiry !== null ? (p.isExpired ? `${Math.abs(p.daysUntilExpiry)} dias atrás` : `${p.daysUntilExpiry} dias`) : "-"}
                </td>
                <td>
                  <Button size="sm" variant="destructive" onClick={() => handleOpenDiscardDialog(p.productId, p.productName, p.quantity)}>
                    Descartar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={discardDialog.open} onOpenChange={(open) => setDiscardDialog({ ...discardDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar Produto</DialogTitle>
            <DialogDescription>Produto: {discardDialog.productName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quantidade (máx: {discardDialog.maxQty.toFixed(3)})</Label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full"
                value={discardQty}
                onChange={(e) => setDiscardQty(e.target.value)}
                placeholder="0.000"
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value as any)}
              >
                <option value="EXPIRED">Vencido</option>
                <option value="DAMAGED">Danificado</option>
                <option value="QUALITY_ISSUE">Problema de Qualidade</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea value={discardNotes} onChange={(e) => setDiscardNotes(e.target.value)} placeholder="Detalhes adicionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscardDialog({ ...discardDialog, open: false })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDiscard} disabled={discardMutation.isPending}>
              {discardMutation.isPending ? "Descartando..." : "Descartar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

