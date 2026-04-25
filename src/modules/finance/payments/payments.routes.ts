import type { FastifyPluginAsync } from "fastify";
import { PaymentsService } from "./payments.service.js";
import { paymentIdParamsSchema, createPaymentSchema } from "./payments.schemas.js";
import {z, ZodError} from "zod";

const paymentsRoutes: FastifyPluginAsync = async(fastify) => {
    const paymentsService = new PaymentsService(fastify.orm);

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    const badRequestErrors = new Set([
        "Linked account not found",
        "Linked bill not found",
    ]);

    fastify.get("/payments", financeAccess, async(request, reply) => {
        const ownerUserId = request.user.sub;
        const payments = await paymentsService.listPayments(ownerUserId);

        return reply.send({data: payments});
    });

    fastify.get("/payments/:id", financeAccess, async(request, reply) => {
        try {
            const params = paymentIdParamsSchema.parse(request.params);
            const ownerUserId = request.user.sub;

            const payment = await paymentsService.getPaymentById(params.id, ownerUserId);
            
            return reply.send({data: payment});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "Payment not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    });

    fastify.post("/payments", financeAccess, async(request, reply) => {
        try {
            const body = createPaymentSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const payment = await paymentsService.createPayment(body, ownerUserId);

            return reply.status(201).send({data: payment});
        } catch (error) {
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

export default paymentsRoutes;