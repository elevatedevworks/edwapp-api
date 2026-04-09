import type {FastifyPluginAsync } from "fastify";
import { z, ZodError} from "zod";
import {
    clientIdParamsSchema,
    createClientSchema,
    updateClientSchema
} from "./clients.schemas";
import { ClientsService } from "./clients.service";

const clientsRoutes: FastifyPluginAsync = async (fastify) => {
    const clientsService = new ClientsService(fastify.orm);

    const authOnly = {preHandler:[fastify.authenticate]};
    const internalAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    fastify.get("/clients", authOnly, async (_request, reply) => {
        const clients = await clientsService.listClients();
        return reply.send({data: clients});
    })

    fastify.get("/clients/:id", authOnly, async (request, reply) => {
        try {
            const params = clientIdParamsSchema.parse(request.params);
            const client = await clientsService.getClientById(params.id);

            return reply.send({data: client});
        } catch (error) {
            if(error instanceof ZodError) {
                return reply.status(400).send({
                    error: "Invalid request paramters",
                    details: z.treeifyError(error)
                });
            }

            if (error instanceof Error && error.message === "Client not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.post("/clients", internalAccess, async (request, reply) => {
        try {
            const body = createClientSchema.parse(request.body);
            const client = await clientsService.createClient(body);

            return reply.status(201).send({data: client});
        } catch (error){
            if(error instanceof ZodError) {
                return reply.status(400).send({
                    error: "Invalid request body",
                    details: z.treeifyError(error)
                });
            }

            if (error instanceof Error && error.message === "Client slug already exists"){
                return reply.status(409).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.patch("/clients/:id", internalAccess, async (request, reply) => {
        try {
            const params = clientIdParamsSchema.parse(request.params);
            const body = updateClientSchema.parse(request.body);

            const client = await clientsService.updateClient(params.id, body);

            return reply.send({data:client})
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request",
                    details: z.treeifyError(error)
                });
            }

            if(error instanceof Error && (error.message === "Client not found" || error.message === "Client update failed")) {
                return reply.status(409).send({
                    error: error.message
                });
            }

            throw error;
        }
    })
}

export default clientsRoutes;