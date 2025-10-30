import { z } from "zod";

export const openCashSchema = z.object({
  openingAmount: z.coerce.number().min(0),
});

export type OpenCashInput = z.infer<typeof openCashSchema>;


