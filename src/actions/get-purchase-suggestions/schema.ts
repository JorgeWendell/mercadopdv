import { z } from "zod";

export const getPurchaseSuggestionsSchema = z.object({
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
});

export type GetPurchaseSuggestionsInput = z.infer<typeof getPurchaseSuggestionsSchema>;

