import { z } from "zod";

export const closeCashSchema = z.object({
  closingAmount: z.coerce.number().min(0),
});

export type CloseCashInput = z.infer<typeof closeCashSchema>;


