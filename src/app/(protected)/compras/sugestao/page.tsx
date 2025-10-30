"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCategories } from "@/hooks/queries/use-categories";
import { useSuppliers } from "@/hooks/queries/use-suppliers";
import { usePurchaseSuggestions } from "@/hooks/queries/use-purchase-suggestions";
import { useCreateDraftPurchase } from "@/hooks/mutations/use-create-draft-purchase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function PurchaseSuggestionPage() {
  const categories = useCategories();
  const suppliers = useSuppliers();
  const createDraftMutation = useCreateDraftPurchase();

  const [categoryId, setCategoryId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const suggestionsQuery = usePurchaseSuggestions({
    categoryId: categoryId || undefined,
    supplierId: supplierId || undefined,
  });

  const rows = suggestionsQuery.data?.success ? suggestionsQuery.data.data : [];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const csvDownload = () => {
    const header = ["Produto", "Código de Barras", "Estoque", "Min", "Max", "Sugerido"];
    const lines = rows.map((r) => [
      r.name,
      r.barcode || "-",
      r.stock.toFixed(3),
      r.minStock.toFixed(3),
      r.maxStock.toFixed(3),
      r.suggestedQty.toFixed(3),
    ]);
    const csv = [header, ...lines]
      .map((arr) => arr.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sugestao-compra-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateDraft = () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos um item");
      return;
    }

    if (!supplierId) {
      toast.error("Selecione um fornecedor");
      return;
    }

    const items = rows
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({
        productId: r.id,
        quantity: r.suggestedQty,
        unitPrice: r.costPrice,
      }));

    createDraftMutation.mutate(
      {
        supplierId,
        items,
        notes: "Pré-pedido gerado pela sugestão de compra",
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success("Pré-pedido criado com sucesso!");
            setSelectedIds(new Set());
          } else {
            toast.error(result.message);
          }
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Sugestão de Compra</h1>

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-sm">Categoria</label>
          <select
            className="border rounded px-2 py-1 block min-w-[220px]"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Todas</option>
            {(categories.data ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Fornecedor</label>
          <select
            className="border rounded px-2 py-1 block min-w-[220px]"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Todos</option>
            {(suppliers.data ?? []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={csvDownload}>Exportar CSV</Button>
        <Button
          onClick={handleGenerateDraft}
          variant="default"
          disabled={createDraftMutation.isPending}
        >
          {createDraftMutation.isPending ? "Gerando..." : `Gerar Pré-Pedido (${selectedIds.size})`}
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="text-sm text-muted-foreground">
          📉 Exibindo {rows.length} produto(s) com estoque abaixo do mínimo
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">
                <Checkbox checked={rows.length > 0 && selectedIds.size === rows.length} onCheckedChange={toggleAll} />
              </th>
              <th>Status</th>
              <th>Produto</th>
              <th>Código de Barras</th>
              <th>Estoque</th>
              <th>Min</th>
              <th>Max</th>
              <th>Sugerido</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/50">
                <td className="py-2">
                  <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                </td>
                <td>
                  <Badge variant="destructive" className="text-xs">
                    Estoque Baixo
                  </Badge>
                </td>
                <td className="font-medium">{r.name}</td>
                <td>{r.barcode || "-"}</td>
                <td className="text-red-600 font-semibold">{r.stock.toFixed(3)}</td>
                <td>{r.minStock.toFixed(3)}</td>
                <td>{r.maxStock.toFixed(3)}</td>
                <td className="font-semibold text-blue-600">{r.suggestedQty.toFixed(3)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-4 text-center text-muted-foreground" colSpan={8}>
                  {suggestionsQuery.isLoading ? "Carregando..." : "✅ Nenhum produto com estoque abaixo do mínimo"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


