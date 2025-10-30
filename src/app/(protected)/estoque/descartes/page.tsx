"use client";

import { useState } from "react";
import { useDiscards } from "@/hooks/queries/use-discards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DescartesPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [productName, setProductName] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useDiscards({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59.999`) : undefined,
    productName: productName || undefined,
    reason: reason || undefined,
  });

  const discards = data?.success ? data.data : [];

  const totalQuantity = discards.reduce((sum, d) => sum + d.quantity, 0);

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setProductName("");
    setReason("");
  };

  const handleExportCSV = () => {
    const header = ["Data", "Produto", "Categoria", "Quantidade", "Motivo", "Descartado por", "Observações"];
    const lines = discards.map((d) => [
      new Date(d.discardedAt).toLocaleString("pt-BR"),
      d.productName || "-",
      d.categoryName || "-",
      d.quantity.toFixed(3),
      d.reasonLabel,
      d.discardedByName || "-",
      d.notes || "-",
    ]);
    const csv = [header, ...lines]
      .map((arr) => arr.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `descartes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("pt-BR");
  };

  const getReasonBadge = (reason: string) => {
    const variants: Record<string, any> = {
      EXPIRED: "destructive",
      DAMAGED: "secondary",
      QUALITY_ISSUE: "secondary",
      OTHER: "outline",
    };
    return <Badge variant={variants[reason] || "outline"}>{getReasonLabel(reason)}</Badge>;
  };

  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      EXPIRED: "Vencido",
      DAMAGED: "Danificado",
      QUALITY_ISSUE: "Problema de Qualidade",
      OTHER: "Outro",
    };
    return labels[reason] || reason;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Histórico de Descartes</h1>
        <Button onClick={handleExportCSV} disabled={discards.length === 0}>
          Exportar CSV
        </Button>
      </div>

      <div className="border rounded p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">Data Início</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Data Fim</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Produto</label>
            <Input placeholder="Nome do produto" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Motivo</label>
            <select className="border rounded px-2 py-1 w-full h-9" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Todos</option>
              <option value="EXPIRED">Vencido</option>
              <option value="DAMAGED">Danificado</option>
              <option value="QUALITY_ISSUE">Problema de Qualidade</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded p-4 bg-muted/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total de Descartes</div>
            <div className="text-2xl font-bold">{discards.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Quantidade Total Descartada</div>
            <div className="text-2xl font-bold">{totalQuantity.toFixed(3)}</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Data/Hora</th>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Quantidade</th>
              <th>Motivo</th>
              <th>Descartado por</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-4 text-center text-muted-foreground" colSpan={7}>
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && discards.length === 0 && (
              <tr>
                <td className="py-4 text-center text-muted-foreground" colSpan={7}>
                  Nenhum descarte encontrado
                </td>
              </tr>
            )}
            {discards.map((d) => (
              <tr key={d.id} className="border-t hover:bg-muted/50">
                <td className="py-2">{formatDate(d.discardedAt)}</td>
                <td className="font-medium">{d.productName || "-"}</td>
                <td>{d.categoryName || "-"}</td>
                <td>{d.quantity.toFixed(3)}</td>
                <td>{getReasonBadge(d.reason)}</td>
                <td>{d.discardedByName || "-"}</td>
                <td className="max-w-xs truncate">{d.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

