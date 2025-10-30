import { z } from "zod";

export const inventoryStartSchema = z.object({
  name: z.string().min(1),
  notes: z.string().optional(),
});

export type InventoryStartInput = z.infer<typeof inventoryStartSchema>;


