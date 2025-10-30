"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { z } from "zod";

import { useCashMovement } from "@/hooks/mutations/use-cash-movement";
import { useCloseCash } from "@/hooks/mutations/use-close-cash";
import { useOpenCash } from "@/hooks/mutations/use-open-cash";
import { useCashStatus } from "@/hooks/queries/use-cash-status";

const openSchema = z.object({ openingAmount: z.coerce.number().min(0) });
const closeSchema = z.object({ closingAmount: z.coerce.number().min(0) });
const movementSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  amount: z.coerce.number().positive(),
  reason: z.string().trim().optional(),
});

type OpenForm = z.infer<typeof openSchema>;
type CloseForm = z.infer<typeof closeSchema>;
type MovementForm = z.infer<typeof movementSchema>;

export default function CaixaPage() {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const startDate = start ? new Date(start) : undefined;
  const endDate = end ? new Date(`${end}T23:59:59.999`) : undefined;
  const cash = useCashStatus({ start: startDate, end: endDate });
  const openMut = useOpenCash();
  const closeMut = useCloseCash();
  const moveMut = useCashMovement();

  const openForm = useForm<OpenForm>({ defaultValues: { openingAmount: 0 } });
  const closeForm = useForm<CloseForm>({ defaultValues: { closingAmount: 0 } });
  const movementForm = useForm<MovementForm>({ defaultValues: { type: "IN", amount: 0, reason: "" } });

  const onOpen = (values: OpenForm) => {
    const parsed = openSchema.safeParse(values);
    if (!parsed.success) return;
    openMut.mutate(parsed.data);
  };
  const onClose = (values: CloseForm) => {
    const parsed = closeSchema.safeParse(values);
    if (!parsed.success) return;
    closeMut.mutate(parsed.data);
  };
  const onMove = (values: MovementForm) => {
    const parsed = movementSchema.safeParse(values);
    if (!parsed.success) return;
    moveMut.mutate(parsed.data);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Caixa</h1>

      {cash.data?.isOpen && cash.data?.totals && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Abertura</div>
            <div className="text-lg font-semibold">R$ {cash.data.totals.opening.toFixed(2)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Entradas</div>
            <div className="text-lg font-semibold text-emerald-600">R$ {cash.data.totals.in.toFixed(2)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Saídas</div>
            <div className="text-lg font-semibold text-rose-600">R$ {cash.data.totals.out.toFixed(2)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Saldo</div>
            <div className="text-lg font-semibold">R$ {cash.data.totals.balance.toFixed(2)}</div>
          </div>
        </div>
      )}

      {!cash.data?.isOpen ? (
        <div className="border rounded-md p-4">
          <h2 className="text-lg font-medium mb-3">Abrir Caixa</h2>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              openForm.handleSubmit(onOpen)();
            }}
          >
            <div className="w-48">
              <label className="text-sm">Valor de abertura</label>
              <NumericFormat
                className="w-full border rounded px-2 py-1"
                value={openForm.watch("openingAmount")}
                onValueChange={(v) => openForm.setValue("openingAmount", Number(v.value || 0))}
                thousandSeparator="."
                decimalSeparator="," 
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                prefix="R$ "
                inputMode="decimal"
              />
            </div>
            <button className="px-3 py-2 rounded bg-primary text-primary-foreground" type="submit" disabled={openMut.isPending}>Abrir</button>
          </form>
        </div>
      ) : (
        <>
          <div className="border rounded-md p-4">
            <h2 className="text-lg font-medium mb-3">Situação do Caixa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Aberto em</div>
                <div>{new Date(String(cash.data.session.openedAt)).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Valor de abertura</div>
                <div>R$ {parseFloat(String(cash.data.session.openingAmount)).toFixed(2)}</div>
              </div>
              <div className="flex items-end justify-end">
                <form
                  className="flex items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    closeForm.handleSubmit(onClose)();
                  }}
                >
                  <div className="w-48">
                    <label className="text-sm">Valor de fechamento</label>
                    <input className="w-full border rounded px-2 py-1" type="number" step="0.01" {...closeForm.register("closingAmount", { valueAsNumber: true })} />
                  </div>
                  <button className="px-3 py-2 rounded bg-destructive text-destructive-foreground" type="submit" disabled={closeMut.isPending}>Fechar Caixa</button>
                </form>
              </div>
            </div>
            {cash.data.totals && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Abertura</div>
                  <div>R$ {cash.data.totals.opening.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Entradas</div>
                  <div>R$ {cash.data.totals.in.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Saídas</div>
                  <div>R$ {cash.data.totals.out.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Saldo</div>
                  <div className="font-semibold">R$ {cash.data.totals.balance.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="border rounded-md p-4">
            <h2 className="text-lg font-medium mb-3">Sangria/Suprimento</h2>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                movementForm.handleSubmit(onMove)();
              }}
            >
              <div className="w-40">
                <label className="text-sm">Tipo</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={movementForm.watch("type")}
                  onChange={(e) => movementForm.setValue("type", e.target.value as MovementForm["type"])}
                >
                  <option value="IN">Suprimento</option>
                  <option value="OUT">Sangria</option>
                </select>
              </div>
              <div className="w-48">
                <label className="text-sm">Valor</label>
                <NumericFormat
                  className="w-full border rounded px-2 py-1"
                  value={movementForm.watch("amount")}
                  onValueChange={(v) => movementForm.setValue("amount", Number(v.value || 0))}
                  thousandSeparator="."
                  decimalSeparator="," 
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                  prefix="R$ "
                  inputMode="decimal"
                />
              </div>
              <div className="min-w-[240px] flex-1">
                <label className="text-sm">Motivo</label>
                <input className="w-full border rounded px-2 py-1" {...movementForm.register("reason")} />
              </div>
              <button className="px-3 py-2 rounded bg-primary text-primary-foreground" type="submit" disabled={moveMut.isPending}>Registrar</button>
            </form>
          </div>

          <div className="border rounded-md p-4">
            <h2 className="text-lg font-medium mb-3">Movimentações</h2>
            <div className="flex gap-2 mb-3">
              <div>
                <label className="text-sm">Início</label>
                <input className="w-full border rounded px-2 py-1" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Fim</label>
                <input className="w-full border rounded px-2 py-1" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2">Data</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {cash.data.movements.map((m: { id: string; createdAt: string | Date; type: string; amount: string | number; reason?: string | null }) => (
                    <tr key={m.id} className="border-t">
                      <td className="py-2">{new Date(String(m.createdAt)).toLocaleString()}</td>
                      <td>{m.type}</td>
                      <td>R$ {Number(m.amount as unknown as number).toFixed(2)}</td>
                      <td>{m.reason ?? "-"}</td>
                    </tr>
                  ))}
                  {cash.data.movements.length === 0 && (
                    <tr>
                      <td className="py-4" colSpan={4}>Sem movimentações</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
