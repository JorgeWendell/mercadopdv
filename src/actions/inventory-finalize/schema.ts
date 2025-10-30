import { z } from "zod";

export const inventoryFinalizeSchema = z.object({
  sessionId: z.string().min(1),
});

export type InventoryFinalizeInput = z.infer<typeof inventoryFinalizeSchema>;


