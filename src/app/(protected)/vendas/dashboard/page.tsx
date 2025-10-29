"use client";

import { useState } from "react";
import { BarChart3, Receipt, UsersRound } from "lucide-react";

import { useSalesDashboard } from "@/hooks/queries/use-sales-dashboard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function VendasDashboardPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { data, isLoading, refetch } = useSalesDashboard({ startDate, endDate });

  const total = data?.totalSalesAmount ?? 0;
  const count = data?.totalSalesCount ?? 0;
  const ticket = data?.averageTicket ?? 0;
  const prevTotal = data?.previousTotalSalesAmount ?? 0;
  const prevCount = data?.previousSalesCount ?? 0;
  const prevTicket = data?.previousAverageTicket ?? 0;
  const top = data?.topProducts ?? [];
  const topPayments = data?.topPaymentMethods ?? [];
  const hourlyToday = data?.hourlyToday ?? [];

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
      </div>

      <div className="rounded-lg border p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="mb-1 block text-sm">Data inicial</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Data final</label>
          <input
            type="date"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => refetch()}>Aplicar</Button>
          <Button
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              refetch();
            }}
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Vendas (R$)</span>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-bold">R$ {total.toFixed(2)}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground text-xs">Período selecionado</span>
            {prevTotal > 0 ? (
              <span className={`text-xs rounded px-1.5 py-0.5 ${total - prevTotal >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {((total - prevTotal) / prevTotal * 100).toFixed(1)}%
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Vendas (Qtd)</span>
            <UsersRound className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-bold">{count}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground text-xs">Período selecionado</span>
            {prevCount > 0 ? (
              <span className={`text-xs rounded px-1.5 py-0.5 ${count - prevCount >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {((count - prevCount) / prevCount * 100).toFixed(1)}%
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Ticket médio</span>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-3xl font-bold">R$ {ticket.toFixed(2)}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground text-xs">Período selecionado</span>
            {prevTicket > 0 ? (
              <span className={`text-xs rounded px-1.5 py-0.5 ${ticket - prevTicket >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {((ticket - prevTicket) / prevTicket * 100).toFixed(1)}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-semibold">Top produtos (Qtd)</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Receita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  Sem dados no período
                </TableCell>
              </TableRow>
            ) : (
              top.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right">{p.quantity.toFixed(3)}</TableCell>
                  <TableCell className="text-right">R$ {p.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border">
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold">Top formas de pagamento</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    Sem dados no período
                  </TableCell>
                </TableRow>
              ) : (
                topPayments.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{p.method}</TableCell>
                    <TableCell className="text-right">{p.count}</TableCell>
                    <TableCell className="text-right">R$ {p.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border">
          <div className="p-4 flex items-center justify-between">
            <h2 className="font-semibold">Vendas por hora (hoje)</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hourlyToday.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    Sem dados hoje
                  </TableCell>
                </TableRow>
              ) : (
                hourlyToday.map((h, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{h.hour}</TableCell>
                    <TableCell className="text-right">{h.count}</TableCell>
                    <TableCell className="text-right">R$ {h.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-semibold">Tendência diária (R$)</h2>
        </div>
        <div className="p-4">
          {data?.dailySales?.length ? (
            <svg viewBox="0 0 600 160" className="w-full h-40">
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                points={(() => {
                  const ds = data.dailySales;
                  const max = Math.max(...ds.map((d) => d.amount));
                  const stepX = 600 / Math.max(1, ds.length - 1);
                  return ds
                    .map((d, i) => {
                      const x = i * stepX;
                      const y = max > 0 ? 150 - (d.amount / max) * 140 : 150;
                      return `${x},${y}`;
                    })
                    .join(" ");
                })()}
              />
            </svg>
          ) : (
            <div className="text-center text-sm text-muted-foreground">Sem dados no período</div>
          )}
        </div>
      </div>
    </div>
  );
}


