import { z } from "zod";

export const createPurchaseFromNFeSchema = z.object({
  supplierId: z.string().min(1, "Fornecedor obrigatório"),
  invoiceNumber: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1, "Adicione pelo menos um item"),
});

export type CreatePurchaseFromNFeInput = z.infer<typeof createPurchaseFromNFeSchema>;

