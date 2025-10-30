import { z } from "zod";

export const createDraftPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Fornecedor obrigatório"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1, "Adicione pelo menos um item"),
  notes: z.string().optional(),
});

export type CreateDraftPurchaseInput = z.infer<
  typeof createDraftPurchaseSchema
>;

