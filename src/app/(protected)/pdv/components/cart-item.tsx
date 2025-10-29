"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;
}

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  quantityInputRef?: (ref: HTMLInputElement | null) => void;
  onTabPress?: () => void;
}

export function CartItemComponent({
  item,
  onUpdateQuantity,
  onRemove,
  quantityInputRef,
  onTabPress,
}: CartItemProps) {
  const handleQuantityChange = (newQuantity: number) => {
    const safeQuantity = newQuantity <= 0 ? 0.001 : newQuantity;
    onUpdateQuantity(item.productId, safeQuantity);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex-1">
        <p className="font-medium">{item.name}</p>
        <p className="text-muted-foreground text-sm">
          R$ {item.price.toFixed(2)} cada • Estoque: {Number(item.stock).toFixed(3)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-muted-foreground text-xs font-medium">Quantidade</label>
          <NumericFormat
            getInputRef={quantityInputRef}
            value={item.quantity}
            decimalSeparator="," 
            thousandSeparator="."
            decimalScale={3}
            fixedDecimalScale
            allowNegative={false}
            allowLeadingZeros={false}
            customInput={Input}
            className="h-8 w-20 text-center"
            onFocus={(e) => {
              e.target.setSelectionRange(0, 0);
            }}
            onValueChange={(values) => {
              const { floatValue } = values;
              if (floatValue === undefined) return;
              const value = Math.max(0, floatValue);
              const roundedValue = Number(value.toFixed(3));
              if (roundedValue === 0) return;
              handleQuantityChange(roundedValue);
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey && onTabPress) {
                e.preventDefault();
                onTabPress();
              }
            }}
            onBlur={(e) => {
              const raw = (e.target as HTMLInputElement).value || "0";
              const normalized = raw.replace(/\./g, "").replace(",", ".");
              const value = parseFloat(normalized) || 0;
              if (value <= 0) {
                handleQuantityChange(0.001);
              } else if (value > Number(item.stock)) {
                const limitedValue = Math.min(value, Number(item.stock));
                handleQuantityChange(Number(limitedValue.toFixed(3)));
              } else {
                handleQuantityChange(Number(value.toFixed(3)));
              }
            }}
          />
        </div>

        <p className="w-24 text-right font-semibold">
          R$ {item.subtotal.toFixed(2)}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(item.productId)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

