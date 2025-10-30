import { z } from "zod";

export const discardProductSchema = z.object({
  productId: z.string().min(1, "Produto obrigatório"),
  batchId: z.string().optional(),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  reason: z.enum(["EXPIRED", "DAMAGED", "QUALITY_ISSUE", "OTHER"]),
  notes: z.string().optional(),
});

export type DiscardProductInput = z.infer<typeof discardProductSchema>;

