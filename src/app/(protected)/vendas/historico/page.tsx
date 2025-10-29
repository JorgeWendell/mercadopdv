"use client";

import { useMemo, useState } from "react";
import { Calendar, ReceiptText } from "lucide-react";

import { useSales } from "@/hooks/queries/use-sales";
import { usePaymentMethods } from "@/hooks/queries/use-payment-methods";
import { getSale } from "@/actions/get-sale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
 

export default function HistoricoVendasPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>(undefined);

  const [page, setPage] = useState(1);
  const pageSize = 12;
  const { data, isLoading, error, refetch } = useSales({ filters: { startDate, endDate, paymentMethodId }, page, pageSize });
  const sales = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const { data: paymentMethods = [] } = usePaymentMethods();

  const rows = useMemo(() => sales, [sales]);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
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
          <div>
            <label className="mb-1 block text-sm">Forma de pagamento</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={paymentMethodId ?? ""}
              onChange={(e) => setPaymentMethodId(e.target.value || undefined)}
            >
              <option value="">Todas</option>
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => { setPage(1); setTimeout(() => refetch(), 0); }}>Aplicar</Button>
            <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); setPaymentMethodId(undefined); refetch(); }}>Limpar</Button>
          </div>
        </div>
        {error ? (
          <div className="p-4 space-y-3 text-center">
            <p className="text-destructive text-sm">Erro ao carregar vendas.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        ) : null}
        {rows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamentos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.saleNumber ?? "-"}</TableCell>
                  <TableCell>
                    {new Date(s.saleDate).toLocaleString()}
                  </TableCell>
                  <TableCell>{s.customerName ?? "Avulso"}</TableCell>
                  <TableCell>{s.itemsCount}</TableCell>
                  <TableCell>R$ {s.finalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    {s.payments.length === 0
                      ? "-"
                      : s.payments
                          .map((p) => `${p.method}: R$ ${p.amount.toFixed(2)}`)
                          .join(" | ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const sale = await getSale(s.id);
                          const paymentsSummary = sale.payments.map((p) => ({
                            name: p.method,
                            amount: p.amount,
                          }));
                          const company = (() => {
                            try { return JSON.parse(localStorage.getItem("companyHeader") || "null"); } catch { return null; }
                          })();
                          const headerHtml = company
                            ? `<div class=\\"center bold\\">${company.name || ""}</div>
                               <div class=\\"center xs\\">${company.cnpj ? `CNPJ: ${company.cnpj}` : ""}</div>
                               <div class=\\"center xs\\">${company.address || ""}</div>`
                            : "";
                          const receiptHtml = `<!DOCTYPE html><html><head><meta charset=\"utf-8\" />
                            <title>Cupom Fiscal</title>
                            <style>
                              @page { size: 80mm auto; margin: 0; }
                              html, body { width: 80mm; margin: 0; padding: 0; }
                              body { font-family: 'Courier New', Courier, monospace; color: #000; }
                              .wrap { padding: 8px 6px; }
                              .center { text-align: center; }
                              .line { border-top: 1px dashed #000; margin: 6px 0; }
                              .sm { font-size: 11px; }
                              .xs { font-size: 10px; }
                              .row { display: flex; justify-content: space-between; gap: 6px; }
                              .bold { font-weight: 700; }
                              table { width: 100%; border-collapse: collapse; }
                              th, td { font-size: 11px; padding: 2px 0; }
                              th { text-align: left; font-weight: 700; }
                              .right { text-align: right; }
                            </style></head><body>
                            <div class=\"wrap\">
                              ${headerHtml}
                              <div class=\"line\"></div>
                              <div class=\"row xs\"><div>Data: ${new Date(sale.saleDate).toLocaleString()}</div><div>PDV: 01</div></div>
                              <div class=\"line\"></div>
                              <table>
                                <thead>
                                  <tr><th>ITEM</th><th class=\"right\">QTD</th><th class=\"right\">V.UN</th><th class=\"right\">TOTAL</th></tr>
                                </thead>
                                <tbody>
                                  ${sale.items.map((it) => (
                                    `<tr>
                                      <td>${(it.name || '').substring(0, 24)}</td>
                                      <td class=\"right\">${it.quantity.toFixed(3)}</td>
                                      <td class=\"right\">${it.unitPrice.toFixed(2)}</td>
                                      <td class=\"right\">${it.subtotal.toFixed(2)}</td>
                                    </tr>`
                                  )).join("")}
                                </tbody>
                              </table>
                              <div class=\"line\"></div>
                              <div class=\"row bold\"><div>TOTAL</div><div>R$ ${sale.total.toFixed(2)}</div></div>
                              <div class=\"line\"></div>
                              <div class=\"bold sm\">PAGAMENTOS</div>
                              ${paymentsSummary.map((p) => (
                                `<div class=\"row xs\"><div>${p.name}</div><div>R$ ${p.amount.toFixed(2)}</div></div>`
                              )).join("")}
                              <div class=\"line\"></div>
                              <div class=\"center xs\">OBRIGADO PELA PREFERÊNCIA!</div>
                              <div class=\"center xs\">VOLTE SEMPRE</div>
                            </div>
                            <script>
                              window.onload = function(){
                                window.print();
                                setTimeout(() => window.close(), 300);
                              }
                            </script>
                          </body></html>`;

                          const w = window.open("", "_blank", "width=600,height=800");
                          if (w) {
                            w.document.open();
                            w.document.write(receiptHtml);
                            w.document.close();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      <ReceiptText className="mr-2 h-4 w-4" /> Reimprimir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4">
            <p className="text-muted-foreground text-sm text-center">
              Nenhuma venda encontrada
            </p>
          </div>
        )}

        <div className="flex items-center justify-between p-3 border-t gap-3 flex-wrap">
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages} — {total} vendas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              « Primeiro
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Anterior
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, page - 2);
              const end = Math.min(totalPages, start + 4);
              const pageNum = start + i;
              if (pageNum > end) return null;
              const isCurrent = pageNum === page;
              return (
                <Button
                  key={pageNum}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              Última »
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ir para</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={page}
              className="w-20 rounded-md border px-2 py-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (!Number.isNaN(val)) setPage(Math.min(totalPages, Math.max(1, val)));
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


