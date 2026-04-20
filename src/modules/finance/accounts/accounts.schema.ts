import {z} from "zod";

export const accountIdParamsSchema = z.object({
    id: z.uuid()
});

export const createAccountSchema = z.object(
    {
    name: z.string().trim().min(1, "Name is required").max(255),
    type: z.enum(["checking", "savings", "credit_card", "cash", "other"]),
    institution: z.string().trim().max(255).optional().nullable(),
    currentBalanceCents: z.number().int().optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().optional().nullable()
}
)

export const updateAccountSchema = createAccountSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  }
);