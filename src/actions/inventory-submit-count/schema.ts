import { z } from "zod";

export const inventorySubmitCountSchema = z.object({
  sessionId: z.string().min(1),
  productId: z.string().min(1),
  countedQty: z.coerce.number().min(0),
});

export type InventorySubmitCountInput = z.infer<typeof inventorySubmitCountSchema>;


