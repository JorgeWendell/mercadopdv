import z from "zod";

export const createSaleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
  totalPrice: z.number().positive(),
});

export const createSalePaymentSchema = z.object({
  paymentMethodId: z.string().min(1),
  amount: z.number().positive(),
});

export const createSaleSchema = z.object({
  customerId: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  items: z.array(createSaleItemSchema).min(1),
  payments: z.array(createSalePaymentSchema).min(1),
});

