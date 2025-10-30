"use client";

import { useMemo, useState } from "react";
import { usePaymentMethods } from "@/hooks/queries/use-payment-methods";
import { useUsers } from "@/hooks/queries/use-users";
import { toast } from "sonner";

import { useCashReport } from "@/hooks/queries/use-cash-report";

export default function CashReportPage() {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  const [appliedStart, setAppliedStart] = useState<Date | undefined>(undefined);
  const [appliedEnd, setAppliedEnd] = useState<Date | undefined>(undefined);

  const [operatorId, setOperatorId] = useState<string>("");
  const [paymentMethodName, setPaymentMethodName] = useState<string>("");

  const q = useCashReport({ start: appliedStart as Date, end: appliedEnd as Date, operatorId, paymentMethodName });

  const usersQ = useUsers({ page: 1, q: "" });
  const pmQ = usePaymentMethods();

  const rows = q.data ?? [];

  const handleApply = () => {
    if (!start || !end) {
      toast.error("Selecione início e fim");
      return;
    }
    const s = new Date(start);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    setAppliedStart(s);
    setAppliedEnd(e);
  };

  const handleCsv = () => {
    if (!rows.length) {
      toast.error("Sem dados para exportar");
      return;
    }
    const header = [
      "Abertura",
      "Fechamento",
      "Operador",
      "Abertura (R$)",
      "Entradas (R$)",
      "Saídas (R$)",
      "Esperado (R$)",
      "Fechado (R$)",
      "Diferença (R$)",
    ];
    const lines = rows.map((r: any) => [
      new Date(String(r.openedAt)).toLocaleString(),
      r.closedAt ? new Date(String(r.closedAt)).toLocaleString() : "",
      r.userName ?? "",
      Number(r.opening).toFixed(2),
      Number(r.in).toFixed(2),
      Number(r.out).toFixed(2),
      Number(r.expected).toFixed(2),
      Number(r.closing).toFixed(2),
      Number(r.difference).toFixed(2),
    ]);
    const csv = [header, ...lines].map((arr) => arr.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-caixa_${start || ""}_${end || ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-4 space-y-4">
      <style>{`
        @media print { .no-print { display: none !important; } }
      `}</style>
      <h1 className="text-xl font-semibold">Relatório de Caixa</h1>

      <div className="flex flex-wrap gap-2 items-end no-print">
        <div>
          <label className="text-sm">Início</label>
          <input className="border rounded px-2 py-1 block" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Fim</label>
          <input className="border rounded px-2 py-1 block" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Operador</label>
          <select className="border rounded px-2 py-1 block min-w-[200px]" value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
            <option value="">Todos</option>
            {(usersQ.data?.users ?? []).map((u: any) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">Forma</label>
          <select className="border rounded px-2 py-1 block min-w-[160px]" value={paymentMethodName} onChange={(e) => setPaymentMethodName(e.target.value)}>
            <option value="">Todas</option>
            {(pmQ.data ?? []).map((m: any) => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
        <button className="px-3 py-2 rounded bg-secondary text-secondary-foreground" onClick={handleApply}>Aplicar</button>
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={handleCsv}>Exportar CSV</button>
        <button className="px-3 py-2 rounded bg-primary/80 text-primary-foreground" onClick={handlePrint}>Imprimir</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Abertura</th>
              <th>Fechamento</th>
              <th>Operador</th>
              <th>Abertura (R$)</th>
              <th>Entradas (R$)</th>
              <th>Saídas (R$)</th>
              <th>Esperado (R$)</th>
              <th>Fechado (R$)</th>
              <th>Diferença (R$)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{new Date(String(r.openedAt)).toLocaleString()}</td>
                <td>{r.closedAt ? new Date(String(r.closedAt)).toLocaleString() : "-"}</td>
                <td>{r.userName || "-"}</td>
                <td>R$ {Number(r.opening).toFixed(2)}</td>
                <td>R$ {Number(r.in).toFixed(2)}</td>
                <td>R$ {Number(r.out).toFixed(2)}</td>
                <td>R$ {Number(r.expected).toFixed(2)}</td>
                <td>R$ {Number(r.closing).toFixed(2)}</td>
                <td className={Number(r.difference) === 0 ? "" : Number(r.difference) > 0 ? "text-emerald-600" : "text-rose-600"}>R$ {Number(r.difference).toFixed(2)}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="border-t font-semibold">
                <td className="py-2" colSpan={3}>Totais</td>
                <td>R$ {rows.reduce((a: number, r: any) => a + Number(r.opening || 0), 0).toFixed(2)}</td>
                <td>R$ {rows.reduce((a: number, r: any) => a + Number(r.in || 0), 0).toFixed(2)}</td>
                <td>R$ {rows.reduce((a: number, r: any) => a + Number(r.out || 0), 0).toFixed(2)}</td>
                <td>R$ {rows.reduce((a: number, r: any) => a + Number(r.expected || 0), 0).toFixed(2)}</td>
                <td>R$ {rows.reduce((a: number, r: any) => a + Number(r.closing || 0), 0).toFixed(2)}</td>
                <td>R$ {rows.reduce((a: number, r: any) => a + Number(r.difference || 0), 0).toFixed(2)}</td>
              </tr>
            )}
            {appliedStart && appliedEnd && rows.length === 0 && (
              <tr>
                <td className="py-4" colSpan={9}>Nenhum registro</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


