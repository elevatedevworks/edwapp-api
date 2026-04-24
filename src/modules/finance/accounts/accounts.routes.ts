import type { FastifyPluginAsync } from "fastify";
import { AccountsService } from "./accounts.service.js";
import { accountIdParamsSchema, createAccountSchema, updateAccountSchema } from "./accounts.schemas.js";
import { z, ZodError } from "zod";

const accountsRoutes: FastifyPluginAsync = async (fastify) => {
    const accountsService = new AccountsService(fastify.orm);

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    fastify.get("/accounts", financeAccess, async (request, reply) => {
        const ownerUserId = request.user.sub;
        const accounts = await accountsService.listAccounts(ownerUserId);

        return reply.send({data: accounts});
    });

    fastify.get("/accounts/:id", financeAccess, async(request, reply) => {
        try{
            const params = accountIdParamsSchema.parse(request.params);
            const ownerUserId = request.user.sub;

            const account = await accountsService.getAccountById( params.id, ownerUserId);

            return reply.send({data: account});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "Account not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.post("/accounts", financeAccess, async(request, reply) => {
        try {
            const body = createAccountSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const account = await accountsService.createAccount(body, ownerUserId);

            return reply.status(201).send({data: account});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request body",
                    details: z.treeifyError(error)
                });
            }

            if(error instanceof Error && error.message === "Account name already exists"){
                return reply.status(409).send({
                    error: error.message
                })
            }

            throw error;
        }
    });

    fastify.patch("/accounts/:id", financeAccess, async(request, reply) => {
        try {
            const params = accountIdParamsSchema.parse(request.params);
            const body = updateAccountSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const account = await accountsService.updateAccount(
                params.id,
                ownerUserId,
                body
            );

            return reply.send({data: account})
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request",
                    details: z.treeifyError(error)
                });
            }

            if(error instanceof Error && (error.message === "Account not found" || error.message === "Account update failed")){
                return reply.status(404).send({
                    error: error.message
                })
            }

            if (error instanceof Error && error.message === "Account name already exists"){
                return reply.status(409).send({
                    error: error.message
                })
            }

            throw error;
        }
    })
}



export default accountsRoutes;