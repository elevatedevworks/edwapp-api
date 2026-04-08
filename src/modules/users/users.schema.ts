import { z} from "zod";

export const userIdParamsSchema = z.object({
    id: z.uuid()
});



export const createUserSchema = z.object(
    {
    email: z.email().max(255),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().trim().min(1).max(255),
    role: z.enum(["admin", "internal", "client"]).optional(),
    isActive: z.boolean().optional()
}
)

export const updateUserSchema = z.object(
    {
    email: z.email().max(255).optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    name: z.string().trim().min(1).max(255).optional(),
    role: z.enum(["admin", "internal", "client"]).optional(),
    isActive: z.boolean().optional()
}
)
.refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
})