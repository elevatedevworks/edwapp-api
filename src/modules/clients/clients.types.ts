import type {z} from "zod";
import type {
    clientIdParamsSchema,
    createClientSchema,
    updateClientSchema

} from "./clients.schemas.js";

export type ClientIdParams = z.infer<typeof clientIdParamsSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;