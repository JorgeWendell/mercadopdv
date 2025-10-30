"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCategories } from "@/hooks/queries/use-categories";
import { useProducts } from "@/hooks/queries/use-products";
import { useInventoryFinalize, useInventoryStart, useInventorySubmitCount } from "@/hooks/mutations/use-inventory";

export default function InventoryPage() {
  const categories = useCategories();
  const productsQ = useProducts();
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const startMut = useInventoryStart();
  const submitMut = useInventorySubmitCount(sessionId);
  const finalizeMut = useInventoryFinalize(sessionId);

  const [categoryId, setCategoryId] = useState<string>("");
  const products = (productsQ.data ?? []).filter((p: any) => (categoryId ? p.categoryId === categoryId : true));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [auditorName, setAuditorName] = useState<string>("");

  const startForm = useForm<{ name: string; notes?: string }>({ defaultValues: { name: "Inventário" } });
  const onStart = startForm.handleSubmit(async (v) => {
    const res = await startMut.mutateAsync({ name: v.name || "Inventário", notes: v.notes });
    setSessionId(res.id);
    toast.success("Sessão iniciada");
  });

  const handleCount = async (productId: string, counted: number) => {
    if (!sessionId) return;
    await submitMut.mutateAsync({ sessionId, productId, countedQty: counted });
  };

  const handleFinalize = async () => {
    if (!sessionId) return;
    try {
      await finalizeMut.mutateAsync({ sessionId });
      setSessionId(undefined);
    } catch {}
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Inventário (Contagem Cíclica)</h1>

      {!sessionId ? (
        <div className="border rounded p-4 flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-sm">Nome</label>
            <input className="border rounded px-2 py-1 block" {...startForm.register("name")} />
          </div>
          <div className="min-w-[280px]">
            <label className="text-sm">Observações</label>
            <input className="border rounded px-2 py-1 block" {...startForm.register("notes")} />
          </div>
          <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={onStart} disabled={startMut.isPending}>Iniciar</button>
        </div>
      ) : (
        <div className="border rounded p-4 flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-sm">Categoria</label>
            <select className="border rounded px-2 py-1 block min-w-[240px]" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Todas</option>
              {(categories.data ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="button" className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50" onClick={handleFinalize} disabled={finalizeMut.isPending || !sessionId}>
            {finalizeMut.isPending ? "Finalizando..." : "Finalizar Inventário"}
          </button>
        </div>
      )}

      {sessionId && (
        <div className="overflow-x-auto">
          <div className="flex flex-wrap gap-2 items-end mb-2">
            <div className="min-w-[280px]">
              <label className="text-sm">Nome do Conferente</label>
              <input className="border rounded px-2 py-1 block" value={auditorName} onChange={(e) => setAuditorName(e.target.value)} />
            </div>
            <button
              className="px-3 py-2 rounded bg-secondary text-secondary-foreground"
              onClick={() => {
                const rows = products.map((p: any) => ({ name: p.name }));
                const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <title>Inventário</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: sans-serif; }
      h1 { font-size: 16px; margin: 0 0 8px; }
      .meta { margin: 8px 0 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 6px; }
      th { text-align: left; }
      .count { width: 160px; }
      .no-print { display: none; }
    </style>
  </head>
  <body>
    <h1>Planilha de Inventário</h1>
    <div class=\"meta\">Nome do Conferente: <strong>${(auditorName || "________________").replace(/</g, "&lt;")}</strong></div>
    <table>
      <thead><tr><th>Produto</th><th class=\"count\">Contado</th></tr></thead>
      <tbody>
        ${rows.map((r) => `<tr><td>${String(r.name).replace(/</g, '&lt;')}</td><td></td></tr>`).join("")}
      </tbody>
    </table>
    <script>setTimeout(()=>window.print(),50)</script>
  </body>
</html>`;
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                iframe.src = url;
                iframe.onload = () => {
                  try { iframe.contentWindow?.focus(); } catch {}
                  setTimeout(() => {
                    try { iframe.contentWindow?.print(); } catch {}
                    setTimeout(() => {
                      URL.revokeObjectURL(url);
                      iframe.remove();
                    }, 1000);
                  }, 100);
                };
                document.body.appendChild(iframe);
              }}
            >
              Imprimir/Salvar PDF
            </button>
            <button
              className="px-3 py-2 rounded bg-primary text-primary-foreground"
              onClick={() => {
                const header = ["Produto", "Contado"]; 
                const lines = products.map((p: any) => [p.name, ""]);
                const csv = [header, ...lines].map((arr) => arr.map((v) => `"${String(v).replaceAll('"','""')}"`).join(";")) .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `planilha-inventario.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Baixar planilha (CSV)
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2">Produto</th>
                <th>Código</th>
                <th>Estoque Atual</th>
                <th>Contado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2">{p.name}</td>
                  <td>{p.barcode || "-"}</td>
                  <td>{Number(p.stock ?? 0).toFixed(3)}</td>
                  <td>
                    <input
                      className="border rounded px-2 py-1 w-32"
                      type="number"
                      step="0.001"
                      min={0}
                      value={counts[p.id] ?? Number(p.stock ?? 0)}
                      onChange={(e) => setCounts((c) => ({ ...c, [p.id]: Number(e.target.value || 0) }))}
                    />
                  </td>
                  <td>
                    <button
                      className="px-3 py-1 rounded bg-secondary text-secondary-foreground disabled:opacity-50"
                      onClick={() => void handleCount(p.id, counts[p.id] ?? Number(p.stock ?? 0))}
                      disabled={submitMut.isPending}
                    >
                      {submitMut.isPending ? "Salvando..." : "Salvar"}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td className="py-4" colSpan={5}>Nenhum produto</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


