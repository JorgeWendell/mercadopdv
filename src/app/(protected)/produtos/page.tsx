"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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

import { useProducts } from "@/hooks/queries/use-products";
import { ProductForm } from "./components/product-form";

const ProdutosPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: products, isLoading } = useProducts();

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="size-4" />
          Novo Produto
        </Button>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : products && products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / Código de Barras</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Preço Compra</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      {product.barcode && (
                        <span className="text-muted-foreground text-xs">
                          {product.barcode}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.categoryName || "-"}</TableCell>
                  <TableCell>{product.supplierName || "-"}</TableCell>
                  <TableCell>
                    R$ {Number(product.purchasePrice).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    R$ {Number(product.salePrice).toFixed(2)}
                  </TableCell>
                  <TableCell>{Number(product.stock).toFixed(3)}</TableCell>
                  <TableCell>{product.active ? "Ativo" : "Inativo"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4">
            <p className="text-muted-foreground text-sm text-center">
              Nenhum produto cadastrado
            </p>
          </div>
        )}
      </div>

      <ProductForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
};

export default ProdutosPage;

