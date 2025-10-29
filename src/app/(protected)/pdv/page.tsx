"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useProducts } from "@/hooks/queries/use-products";
import { useCustomers } from "@/hooks/queries/use-customers";
import { CartItemComponent } from "./components/cart-item";
import { PaymentDialog } from "./components/payment-dialog";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
}

const PDVPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const finalizeButtonRef = useRef<HTMLButtonElement>(null);

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const roundedQuantity = Number(quantity.toFixed(3));
          const stockNumber = Number(item.stock);
          if (roundedQuantity > stockNumber) {
            toast.error(`Quantidade indisponível. Estoque: ${stockNumber.toFixed(3)}`);
            return item;
          }
          const subtotal = Number((item.price * roundedQuantity).toFixed(2));
          return { ...item, quantity: roundedQuantity, subtotal };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const addToCart = (product: {
    id: string;
    name: string;
    salePrice: string;
    stock: number | string;
    active?: boolean;
  }) => {
    if (product.active === false) {
      toast.error("Produto inativo");
      return;
    }

    const stockNumber = Number(product.stock);
    
    if (stockNumber <= 0) {
      toast.error("Produto sem estoque");
      return;
    }

    const price = Number(product.salePrice);
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      const newQuantity = Number((existingItem.quantity + 0.001).toFixed(3));
      if (newQuantity > Number(existingItem.stock)) {
        toast.error(`Quantidade indisponível. Estoque: ${Number(existingItem.stock).toFixed(3)}`);
        return;
      }
      updateQuantity(product.id, newQuantity);
      
      setTimeout(() => {
        const input = quantityInputRefs.current.get(product.id);
        if (input) {
          input.focus();
          input.setSelectionRange(0, 0);
        }
      }, 100);
    } else {
      setCart((prev) => {
        const newCart = [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price,
            quantity: 0.001,
            subtotal: Number((price * 0.001).toFixed(2)),
            stock: stockNumber,
          },
        ];
        
        setTimeout(() => {
          const input = quantityInputRefs.current.get(product.id);
          if (input) {
            input.focus();
            input.setSelectionRange(0, 0);
          }
        }, 100);
        
        return newCart;
      });
    }

    setSearchTerm("");
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    if (products.length === 0) {
      toast.error("Produtos ainda não carregados");
      return;
    }

    const searchValue = searchTerm.trim();
    const searchLower = searchValue.toLowerCase();

    const product = products.find((p) => {
      if (!p || !p.id) return false;

      const normalizedBarcode = p.barcode
        ? p.barcode.toString().trim().toLowerCase()
        : "";
      const normalizedName = p.name ? p.name.trim().toLowerCase() : "";

      const barcodeMatch =
        normalizedBarcode !== "" && normalizedBarcode === searchLower;
      const nameMatch = normalizedName.includes(searchLower);

      return barcodeMatch || nameMatch;
    });

    if (product) {
      if (!product.active) {
        toast.error("Produto inativo");
        return;
      }

      if (product.stock <= 0) {
        toast.error("Produto sem estoque");
        return;
      }

      addToCart({
        id: product.id,
        name: product.name,
        salePrice: product.salePrice.toString(),
        stock: product.stock,
        active: product.active,
      });
      
      setSearchTerm("");
      
      setTimeout(() => {
        const lastItem = cart[cart.length - 1];
        if (lastItem) {
          const input = quantityInputRefs.current.get(lastItem.productId);
          if (input) {
            input.focus();
            input.setSelectionRange(0, 0);
          }
        }
      }, 100);
    } else {
      toast.error(
        `Produto não encontrado. Código/nome buscado: "${searchValue}"`
      );
    }
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCompletePayment = () => {
    setCart([]);
    setSearchTerm("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F3") {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        }
      }
      if (e.key === "F6") {
        e.preventDefault();
        if (cart.length > 0) {
          setCart([]);
          setSearchTerm("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDV - Ponto de Venda</h1>
      </div>

      <div className="grid flex-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4 md:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="size-5" />
            <h2 className="font-semibold">Área de Venda</h2>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar produto por nome ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchTerm.trim()) {
                    e.preventDefault();
                    handleSearch();
                  }
                  if (e.key === "Tab" && !e.shiftKey && cart.length > 0) {
                    e.preventDefault();
                    const firstItem = cart[0];
                    if (firstItem) {
                      setTimeout(() => {
                        const input = quantityInputRefs.current.get(firstItem.productId);
                        if (input) {
                          input.focus();
                          input.setSelectionRange(0, 0);
                        }
                      }, 0);
                    }
                  }
                }}
                className="pl-10"
                autoFocus
              />
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              Pressione Enter para adicionar ou use o leitor de código de
              barras
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Carrinho de Compras</h3>
            {cart.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Carrinho vazio. Busque e adicione produtos
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {cart.map((item, index) => (
                  <CartItemComponent
                    key={item.productId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    quantityInputRef={(ref) => {
                      if (ref) {
                        quantityInputRefs.current.set(item.productId, ref);
                      } else {
                        quantityInputRefs.current.delete(item.productId);
                      }
                    }}
                    onTabPress={() => {
                      searchInputRef.current?.focus();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-4 font-semibold">Resumo da Venda</h2>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Total:</p>
                <p className="text-3xl font-bold">R$ {total.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">
                  Itens: {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>

              <Button
                ref={finalizeButtonRef}
                className="w-full"
                size="lg"
                onClick={() => setIsPaymentOpen(true)}
                disabled={cart.length === 0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (cart.length > 0) {
                      setIsPaymentOpen(true);
                    }
                  }
                }}
              >
                Finalizar Venda
              </Button>

              {cart.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCart([])}
                >
                  Limpar Carrinho
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        total={total}
        cart={cart}
        customers={customers}
        onComplete={handleCompletePayment}
      />
    </div>
  );
};

export default PDVPage;

