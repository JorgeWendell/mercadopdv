import z from "zod";

export const createPurchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  batch: z.string().optional(),
  expirationDate: z.string().optional(),
});

export const createPurchaseSchema = z.object({
  invoiceNumber: z.string().optional(),
  supplierId: z.string().min(1),
  purchaseDate: z.string().min(1),
  items: z.array(createPurchaseItemSchema).min(1),
});

