import { z } from "zod";

export const clientIdParamsSchema = z.object({
    id: z.uuid()
});

export const createClientSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(255),
    slug: z .string().trim().min(1, "Slug is required").max(255).regex(/^[a-z0-9-]+$/, "Slug must user lowercase letters, number, and hyphens only"),
    companyType: z.string().trim().max(255).optional().nullable(),
    primaryContactName: z.string().trim().max(255).optional().nullable(),
    primaryContactEmail: z.email().max(255).optional().nullable(),
    primaryContactPhone: z.string().trim().max(50).optional().nullable(),
    websiteUrl: z.string().trim().url().max(500).optional().nullable(),
    status: z.enum(["lead", "active", "inactive", "archived"]).optional(),
    notes: z.string().trim().optional().nullable()
});

export const updateClientSchema = createClientSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field must be provided for update"
    }
)