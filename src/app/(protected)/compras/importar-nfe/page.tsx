"use client";

import { useEffect,useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCreatePurchaseFromNFe } from "@/hooks/mutations/use-create-purchase-from-nfe";
import { useProducts } from "@/hooks/queries/use-products";
import { useSuppliers } from "@/hooks/queries/use-suppliers";

interface NFeItem {
  codigo: string;
  descricao: string;
  qtd: number;
  vUn: number;
  mapped: boolean;
  productId: string | null;
  productName: string | null;
}

export default function ImportNFePage() {
  const [xmlName, setXmlName] = useState<string>("");
  const [items, setItems] = useState<NFeItem[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const productsQuery = useProducts();
  const suppliersQuery = useSuppliers();
  const createPurchaseMutation = useCreatePurchaseFromNFe();
  const products = productsQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const handleFile = async (file: File) => {
    setXmlName(file.name);
    const text = await file.text();
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "application/xml");
      const dets = Array.from(doc.getElementsByTagName("det"));
      const parsed: NFeItem[] = dets.map((det) => {
        const prod = det.getElementsByTagName("prod")[0];
        const cEAN = prod?.getElementsByTagName("cEAN")[0]?.textContent || "";
        const xProd = prod?.getElementsByTagName("xProd")[0]?.textContent || "";
        const qCom = Number(prod?.getElementsByTagName("qCom")[0]?.textContent || 0);
        const vUnCom = Number(prod?.getElementsByTagName("vUnCom")[0]?.textContent || 0);
        return { codigo: cEAN, descricao: xProd, qtd: qCom, vUn: vUnCom, mapped: false, productId: null, productName: null };
      });
      setItems(parsed);
    } catch {
      setItems([]);
      toast.error("Falha ao processar XML");
    }
  };

  useEffect(() => {
    if (items.length === 0 || products.length === 0) return;
    setItems((prev) =>
      prev.map((it) => {
        const match = products.find((p: any) => p.barcode && p.barcode === it.codigo);
        if (match) {
          return { ...it, mapped: true, productId: match.id, productName: match.name };
        }
        return { ...it, mapped: false, productId: null, productName: null };
      })
    );
  }, [products, items.length]);

  const handleLaunchEntry = () => {
    const unmapped = items.filter((it) => !it.mapped);
    if (unmapped.length > 0) {
      toast.error(`${unmapped.length} item(ns) sem correspondência. Revise antes de lançar.`);
      return;
    }

    if (!supplierId) {
      toast.error("Selecione um fornecedor");
      return;
    }

    const purchaseItems = items.map((it) => ({
      productId: it.productId!,
      quantity: it.qtd,
      unitPrice: it.vUn,
    }));

    createPurchaseMutation.mutate(
      {
        supplierId,
        invoiceNumber: invoiceNumber || undefined,
        items: purchaseItems,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success("Entrada lançada com sucesso!");
            setItems([]);
            setXmlName("");
            setInvoiceNumber("");
          } else {
            toast.error(result.message);
          }
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Importar NFe (XML)</h1>

      <div className="border rounded p-4 space-y-2">
        <input
          type="file"
          accept=".xml,application/xml,text/xml"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {xmlName && <div className="text-sm text-muted-foreground">Arquivo: {xmlName}</div>}
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-sm">Fornecedor</label>
            <select
              className="border rounded px-2 py-1 block min-w-[220px]"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Selecione</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Nº Nota Fiscal (opcional)</label>
            <input
              type="text"
              className="border rounded px-2 py-1 block min-w-[220px]"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ex: 12345"
            />
          </div>
          <Button onClick={handleLaunchEntry} disabled={createPurchaseMutation.isPending}>
            {createPurchaseMutation.isPending ? "Lançando..." : "Lançar Entrada"}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Status</th>
              <th>Código</th>
              <th>Descrição NFe</th>
              <th>Produto Mapeado</th>
              <th>Qtd</th>
              <th>V. Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className={`border-t ${!it.mapped ? "bg-red-50" : ""}`}>
                <td className="py-2">
                  {it.mapped ? (
                    <Badge variant="default">Mapeado</Badge>
                  ) : (
                    <Badge variant="destructive">Não encontrado</Badge>
                  )}
                </td>
                <td>{it.codigo || "-"}</td>
                <td>{it.descricao}</td>
                <td>{it.productName || "-"}</td>
                <td>{it.qtd.toFixed(3)}</td>
                <td>R$ {it.vUn.toFixed(2)}</td>
                <td>R$ {(it.qtd * it.vUn).toFixed(2)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-4" colSpan={7}>
                  Nenhum item
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


