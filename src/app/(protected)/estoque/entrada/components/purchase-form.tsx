"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { useCreatePurchase } from "@/hooks/mutations/use-create-purchase";
import { useSuppliers } from "@/hooks/queries/use-suppliers";
import { useProducts } from "@/hooks/queries/use-products";

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

const purchaseItemSchema = z.object({
  productId: z.string().min(1, { message: "Produto é obrigatório" }),
  quantity: z
    .string()
    .min(1, { message: "Quantidade é obrigatória" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantidade deve ser maior que zero",
    }),
  unitPrice: z
    .string()
    .min(1, { message: "Preço unitário é obrigatório" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Preço unitário deve ser maior que zero",
    }),
  batch: z.string().optional(),
  expirationDate: z.string().optional(),
});

const purchaseSchema = z.object({
  invoiceNumber: z.string().optional(),
  supplierId: z.string().min(1, { message: "Fornecedor é obrigatório" }),
  purchaseDate: z.string().min(1, { message: "Data é obrigatória" }),
  items: z.array(purchaseItemSchema).optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;
type PurchaseItemFormValues = z.infer<typeof purchaseItemSchema>;

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseForm({ open, onOpenChange }: PurchaseFormProps) {
  const [items, setItems] = useState<PurchaseItemFormValues[]>([]);
  const [barcodeSearchState, setBarcodeSearchState] = useState<
    Record<number, { loading: boolean; found: boolean }>
  >({});
  const createPurchaseMutation = useCreatePurchase();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      invoiceNumber: "",
      supplierId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      items: [],
    },
  });

  const addItem = () => {
    const newItem: PurchaseItemFormValues = {
      productId: "",
      quantity: "",
      unitPrice: "",
      batch: "",
      expirationDate: "",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseItemFormValues, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  async function onSubmit(values: PurchaseFormValues) {
    if (!items || items.length === 0) {
      form.setError("items", {
        type: "manual",
        message: "Adicione pelo menos um item",
      });
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.productId &&
        item.productId.trim() !== "" &&
        item.quantity &&
        item.quantity.trim() !== "" &&
        item.unitPrice &&
        item.unitPrice.trim() !== "" &&
        !isNaN(Number(item.quantity)) &&
        !isNaN(Number(item.unitPrice)) &&
        Number(item.quantity) > 0 &&
        Number(item.unitPrice) > 0
    );

    if (validItems.length === 0) {
      form.setError("items", {
        type: "manual",
        message: "Adicione pelo menos um item válido com produto, quantidade e preço preenchidos",
      });
      return;
    }

    if (validItems.length !== items.length) {
      form.setError("items", {
        type: "manual",
        message: "Alguns itens estão incompletos. Verifique se todos os campos obrigatórios estão preenchidos.",
      });
      return;
    }

    const purchaseItems = validItems.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.quantity) * Number(item.unitPrice),
      batch: item.batch && item.batch.trim() !== "" ? item.batch : undefined,
      expirationDate:
        item.expirationDate && item.expirationDate.trim() !== ""
          ? item.expirationDate
          : undefined,
    }));

    try {
      await createPurchaseMutation.mutateAsync({
        invoiceNumber: values.invoiceNumber?.trim() || undefined,
        supplierId: values.supplierId,
        purchaseDate: values.purchaseDate,
        items: purchaseItems,
      });

      form.reset();
      setItems([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar compra:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Entrada de Mercadorias</DialogTitle>
          <DialogDescription>
            Registre uma nova entrada de mercadorias no estoque
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Field>

                <Field>
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Nota Fiscal</FormLabel>
                        <FormControl>
                          <Input placeholder="000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Field>

                <Field>
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Compra *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Field>
              </div>
            </FieldGroup>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Itens da Compra</h3>
                <Button type="button" variant="outline" onClick={addItem}>
                  Adicionar Item
                </Button>
              </div>

              <FormField
                control={form.control}
                name="items"
                render={() => (
                  <FormItem>
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border p-4"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <span className="font-medium">Item {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              Remover
                            </Button>
                          </div>

                          <div className="mb-4 space-y-2">
                            <label className="block text-sm font-medium">
                              Buscar por Código de Barras
                            </label>
                            <div className="relative">
                              <Input
                                id={`barcode-${index}`}
                                placeholder="Digite o código de barras e pressione Enter"
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const barcodeInput = e.currentTarget.value.trim();
                                    if (barcodeInput) {
                                      setBarcodeSearchState((prev) => ({
                                        ...prev,
                                        [index]: { loading: true, found: false },
                                      }));

                                      await new Promise((resolve) =>
                                        setTimeout(resolve, 100)
                                      );

                                      const foundProduct = products.find(
                                        (p) => p.barcode === barcodeInput
                                      );

                                      if (foundProduct) {
                                        const updatedItems = [...items];
                                        updatedItems[index] = {
                                          ...updatedItems[index],
                                          productId: foundProduct.id,
                                          unitPrice: Number(foundProduct.purchasePrice).toFixed(2),
                                        };
                                        setItems(updatedItems);
                                        
                                        setBarcodeSearchState((prev) => ({
                                          ...prev,
                                          [index]: { loading: false, found: true },
                                        }));
                                        toast.success(
                                          `Produto "${foundProduct.name}" encontrado!`
                                        );
                                        if (e.currentTarget) {
                                          e.currentTarget.value = "";
                                        }

                                        setTimeout(() => {
                                          setBarcodeSearchState((prev) => {
                                            const newState = { ...prev };
                                            delete newState[index];
                                            return newState;
                                          });
                                        }, 2000);
                                      } else {
                                        setBarcodeSearchState((prev) => ({
                                          ...prev,
                                          [index]: { loading: false, found: false },
                                        }));
                                        toast.error(
                                          "Produto não encontrado com este código de barras"
                                        );

                                        setTimeout(() => {
                                          setBarcodeSearchState((prev) => {
                                            const newState = { ...prev };
                                            delete newState[index];
                                            return newState;
                                          });
                                        }, 2000);
                                      }
                                    }
                                  }
                                }}
                                className={
                                  barcodeSearchState[index]?.found
                                    ? "border-green-500 pr-10"
                                    : barcodeSearchState[index]?.found === false
                                      ? "border-red-500 pr-10"
                                      : ""
                                }
                              />
                              {barcodeSearchState[index]?.loading && (
                                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                              )}
                              {barcodeSearchState[index]?.found === true &&
                                !barcodeSearchState[index]?.loading && (
                                  <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                                )}
                              {barcodeSearchState[index]?.found === false &&
                                !barcodeSearchState[index]?.loading && (
                                  <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                                )}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-4">
                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                Produto *
                              </label>
                              <Select
                                value={item.productId}
                                onValueChange={(value) =>
                                  updateItem(index, "productId", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o produto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!item.productId && (
                                <p className="text-destructive mt-1 text-xs">
                                  Produto é obrigatório
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                Quantidade *
                              </label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(index, "quantity", e.target.value)
                                }
                                placeholder="0"
                              />
                              {(!item.quantity || Number(item.quantity) <= 0) && (
                                <p className="text-destructive mt-1 text-xs">
                                  Quantidade deve ser maior que zero
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                Preço Unitário *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateItem(index, "unitPrice", e.target.value)
                                }
                                placeholder="0.00"
                              />
                              {(!item.unitPrice || Number(item.unitPrice) <= 0) && (
                                <p className="text-destructive mt-1 text-xs">
                                  Preço deve ser maior que zero
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                Lote
                              </label>
                              <Input
                                value={item.batch || ""}
                                onChange={(e) =>
                                  updateItem(index, "batch", e.target.value)
                                }
                                placeholder="Opcional"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                Data de Validade
                              </label>
                              <Input
                                type="date"
                                value={item.expirationDate || ""}
                                onChange={(e) =>
                                  updateItem(index, "expirationDate", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {items.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Nenhum item adicionado. Clique em "Adicionar Item" para
                    começar.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createPurchaseMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createPurchaseMutation.isPending ||
                  items.length === 0 ||
                  form.formState.isSubmitting
                }
              >
                {createPurchaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Entrada"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

