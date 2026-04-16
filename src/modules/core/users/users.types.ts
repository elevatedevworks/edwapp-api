import type {z} from "zod";
import type {
    userIdParamsSchema,
    createUserSchema,
    updateUserSchema
} from "./users.schema";

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;