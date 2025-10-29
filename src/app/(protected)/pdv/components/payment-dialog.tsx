"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { usePaymentMethods, getPaymentMethodsQueryKey } from "@/hooks/queries/use-payment-methods";
import { getSalesQueryKey } from "@/hooks/queries/use-sales";
import { useCreateSale } from "@/hooks/mutations/use-create-sale";
import { seedPaymentMethods } from "@/actions/seed-payment-methods";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const paymentSchema = z.object({
  customerId: z.string().optional(),
  paymentMethods: z
    .array(
      z.object({
        methodId: z.string().min(1, { message: "Forma de pagamento é obrigatória" }),
        amount: z
          .string()
          .min(1, { message: "Valor é obrigatório" })
          .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "Valor deve ser maior que zero",
          }),
      })
    )
    .min(1, { message: "Adicione pelo menos uma forma de pagamento" }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cart: CartItem[];
  customers?: { id: string; name: string; cpf?: string | null; cnpj?: string | null }[];
  onComplete: (data: PaymentFormValues) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  cart,
  customers = [],
  onComplete,
}: PaymentDialogProps) {
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = usePaymentMethods();
  const createSaleMutation = useCreateSale();
  const queryClient = useQueryClient();
  const firstMethodTriggerRef = useRef<HTMLButtonElement | null>(null);
  const firstAmountInputRef = useRef<HTMLInputElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const methodTriggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const amountInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (open && !isLoadingPaymentMethods && paymentMethods.length === 0) {
      seedPaymentMethods()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: getPaymentMethodsQueryKey() });
        })
        .catch((error) => {
          console.error("Erro ao criar métodos de pagamento:", error);
        });
    }
  }, [open, isLoadingPaymentMethods, paymentMethods.length, queryClient]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        firstMethodTriggerRef.current?.focus();
      }, 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        if (
          !createSaleMutation.isPending &&
          form.getValues("paymentMethods").reduce((s, pm) => s + Number(pm.amount || 0), 0) >= total
        ) {
          void form.handleSubmit(onSubmit)();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, createSaleMutation.isPending, total]);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: "",
      paymentMethods: [{ methodId: "", amount: total.toFixed(2) }],
    },
  });

  const paymentMethodsWatch = form.watch("paymentMethods");

  const addPaymentMethod = () => {
    const current = form.getValues("paymentMethods");
    const totalPaid = current.reduce(
      (sum, pm) => sum + Number(pm.amount || 0),
      0
    );
    const remaining = total - totalPaid;
    form.setValue("paymentMethods", [
      ...current,
      { methodId: "", amount: remaining > 0 ? remaining.toFixed(2) : "0" },
    ]);
  };

  const removePaymentMethod = (index: number) => {
    const current = form.getValues("paymentMethods");
    form.setValue(
      "paymentMethods",
      current.filter((_, i) => i !== index)
    );
  };

  const updatePaymentMethod = (
    index: number,
    field: "methodId" | "amount",
    value: string
  ) => {
    const current = form.getValues("paymentMethods");
    current[index][field] = value;
    form.setValue("paymentMethods", current);
  };

  const totalPaid = paymentMethodsWatch.reduce(
    (sum, pm) => sum + Number(pm.amount || 0),
    0
  );
  const change = totalPaid - total;

  async function onSubmit(values: PaymentFormValues) {
    if (totalPaid < total) {
      toast.error("Valor pago é menor que o total da venda");
      return;
    }

    if (cart.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }

    const saleItems = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: 0,
      totalPrice: item.subtotal,
    }));

    const salePayments = values.paymentMethods.map((pm) => ({
      paymentMethodId: pm.methodId,
      amount: Number(pm.amount),
    }));

    try {
      await createSaleMutation.mutateAsync({
        customerId: values.customerId || undefined,
        discountAmount: 0,
        items: saleItems,
        payments: salePayments,
      });

      // Atualiza histórico de vendas
      queryClient.invalidateQueries({ queryKey: getSalesQueryKey() });

      const methodById = new Map(paymentMethods.map((m) => [m.id, m.name] as const));
      const paymentsSummary = values.paymentMethods.map((pm) => ({
        name: methodById.get(pm.methodId) || pm.methodId,
        amount: Number(pm.amount),
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
          .w { white-space: pre; }
          table { width: 100%; border-collapse: collapse; }
          th, td { font-size: 11px; padding: 2px 0; }
          th { text-align: left; font-weight: 700; }
          .right { text-align: right; }
        </style></head><body>
        <div class=\"wrap\">
          ${headerHtml}
          <div class=\"line\"></div>
          <div class=\"row xs\"><div>Data: ${new Date().toLocaleString()}</div><div>PDV: 01</div></div>
          <div class=\"line\"></div>
          <table>
            <thead>
              <tr><th>ITEM</th><th class=\"right\">QTD</th><th class=\"right\">V.UN</th><th class=\"right\">TOTAL</th></tr>
            </thead>
            <tbody>
              ${cart.map((it) => (
                `<tr>
                  <td>${(it.name || '').substring(0, 24)}</td>
                  <td class=\"right\">${it.quantity.toFixed(3)}</td>
                  <td class=\"right\">${it.price.toFixed(2)}</td>
                  <td class=\"right\">${it.subtotal.toFixed(2)}</td>
                </tr>`
              )).join("")}
            </tbody>
          </table>
          <div class=\"line\"></div>
          <div class=\"row bold\"><div>TOTAL</div><div>R$ ${total.toFixed(2)}</div></div>
          <div class=\"line\"></div>
          <div class=\"bold sm\">PAGAMENTOS</div>
          ${paymentsSummary.map((p) => (
            `<div class=\"row xs\"><div>${p.name}</div><div>R$ ${p.amount.toFixed(2)}</div></div>`
          )).join("")}
          ${change > 0 ? `<div class=\"row xs bold\"><div>TROCO</div><div>R$ ${change.toFixed(2)}</div></div>` : ""}
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

      form.reset();
      onOpenChange(false);
      onComplete(values);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
          <DialogDescription>
            Total da venda: R$ {total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
              if (e.key === "F3") {
                e.preventDefault();
                const canFinalize =
                  !createSaleMutation.isPending &&
                  form
                    .getValues("paymentMethods")
                    .reduce((s, pm) => s + Number(pm.amount || 0), 0) >= total;
                if (canFinalize) {
                  void form.handleSubmit(onSubmit)();
                } else {
                  toast.error("Valor pago é menor que o total da venda");
                }
              }
            }}
            className="space-y-6"
          >
            <FieldGroup>
              <Field>
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente (Opcional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value === "none" ? "" : value);
                        }}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Venda avulsa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Venda avulsa</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Field>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Formas de Pagamento</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPaymentMethod}
                    ref={addButtonRef}
                  >
                    Adicionar
                  </Button>
                </div>

                {paymentMethodsWatch.map((pm, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Forma de Pagamento *
                        </label>
                        <Select
                          value={pm.methodId}
                          onValueChange={(value) =>
                            updatePaymentMethod(index, "methodId", value)
                          }
                        >
                          <SelectTrigger
                            ref={(el) => {
                              if (index === 0) firstMethodTriggerRef.current = el;
                              if (el) methodTriggerRefs.current.set(index, el);
                              else methodTriggerRefs.current.delete(index);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const input = amountInputRefs.current.get(index);
                                if (input) input.focus();
                              }
                            }}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.length > 0 ? (
                              paymentMethods.map((method) => (
                                <SelectItem key={method.id} value={method.id}>
                                  {method.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-methods" disabled>
                                Nenhum método de pagamento disponível
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Valor *
                        </label>
                         <Input
                          type="number"
                          step="0.01"
                          value={pm.amount}
                          onChange={(e) =>
                            updatePaymentMethod(index, "amount", e.target.value)
                          }
                          placeholder="0.00"
                          ref={(el) => {
                            if (index === 0) firstAmountInputRef.current = el;
                            if (el) amountInputRefs.current.set(index, el);
                            else amountInputRefs.current.delete(index);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Tab" && !e.shiftKey) {
                              e.preventDefault();
                              const currentLen = form.getValues("paymentMethods").length;
                              addButtonRef.current?.click();
                              setTimeout(() => {
                                const trigger = methodTriggerRefs.current.get(currentLen);
                                if (trigger) trigger.focus();
                              }, 0);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {paymentMethodsWatch.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentMethod(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="font-semibold">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Pago:</span>
                  <span className="font-semibold">
                    R$ {totalPaid.toFixed(2)}
                  </span>
                </div>
                {change > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">Troco:</span>
                    <span className="font-semibold">R$ {change.toFixed(2)}</span>
                  </div>
                )}
                {totalPaid < total && (
                  <div className="flex justify-between text-destructive">
                    <span className="font-medium">Falta:</span>
                    <span className="font-semibold">
                      R$ {(total - totalPaid).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createSaleMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createSaleMutation.isPending ||
                  form.formState.isSubmitting ||
                  totalPaid < total
                }
              >
                {createSaleMutation.isPending || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Finalizar Venda"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

