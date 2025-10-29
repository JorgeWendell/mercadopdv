import z from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  documentType: z.enum(["cpf", "cnpj", "none"]).optional(),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});
