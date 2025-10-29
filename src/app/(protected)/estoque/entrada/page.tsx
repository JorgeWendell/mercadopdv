"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { usePurchases } from "@/hooks/queries/use-purchases";
import { PurchaseForm } from "./components/purchase-form";

const EntradaMercadoriasPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: purchases, isLoading } = usePurchases();

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Entrada de Mercadorias</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Package className="size-4" />
          Nova Entrada
        </Button>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : purchases && purchases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                  <TableCell className="font-medium">
                    {purchase.supplierName || "-"}
                  </TableCell>
                  <TableCell>{purchase.invoiceNumber || "-"}</TableCell>
                  <TableCell>{formatCurrency(purchase.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4">
            <p className="text-muted-foreground text-sm text-center">
              Nenhuma entrada registrada
            </p>
          </div>
        )}
      </div>

      <PurchaseForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
};

export default EntradaMercadoriasPage;

