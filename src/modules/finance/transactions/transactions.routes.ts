import type {FastifyPluginAsync } from "fastify";
import { TransactionsService } from "./transactions.service.js";
import {transactionIdParamsSchema, createTransactionSchema} from "./transactions.schemas.js";
import {z, ZodError} from "zod";

const transactionsRoutes: FastifyPluginAsync = async(fastify) => {
    const transactionsService = new TransactionsService(fastify.orm);

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    const badRequestErrors = new Set([
        "counterpartyAccountId must be null when transaction kind is expense, adjustment, income, or credit_card_purchase",
        "counterpartyAccountId is required when transaction kind is transfer",
        "counterpartyAccoutId cannot be the same as accountId",
        "Linked account not found",
        "Selected account is not a credit card account",
        "Linked bill not found"
    ]);

    fastify.get("/transactions", financeAccess, async(request, reply) => {
        const ownerUserId = request.user.sub;
        const transactions = await transactionsService.listTransactions(ownerUserId);

        return reply.send({data: transactions});
    })

    fastify.get("/transactions/:id", financeAccess, async(request, reply) => {
        try {
            const params = transactionIdParamsSchema.parse(request.params);
            const ownerUserId = request.user.sub;

            const transaction = await transactionsService.getTransactionById(params.id, ownerUserId);

            return reply.send({data: transaction})
            
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }
            if(error instanceof Error && error.message === "Transaction not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.post("/transactions", financeAccess, async(request, reply) => {
        try {
            const body = createTransactionSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const transaction = await transactionsService.createTransaction(body, ownerUserId);

            return reply.status(201).send({data: transaction});
        } catch (error){
            if (error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request body",
                    details: z.treeifyError(error)
                });
            };
            

            if(error instanceof Error && badRequestErrors.has(error.message)
                ){
                return reply.status(400).send({
                    error: error.message
                })
            }

            throw error;
        }
    })
}

export default transactionsRoutes;