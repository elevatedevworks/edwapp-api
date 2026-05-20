import type { FastifyPluginAsync } from "fastify";
import { BillInstancesService } from "./bill-instances.service.js";
import { billInstanceParamsSchema, createBillInstanceSchema, updateBillInstanceSchema } from "./bill-instances.schemas.js";
import {z, ZodError} from "zod";

const billInstancesRoutes: FastifyPluginAsync = async(fastify) => {
    const billInstancesService = new BillInstancesService(fastify.orm);

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    const badRequestErrors = new Set([
        "Bill instance already exists for this period",
        "Linked bill not found",
        "Bill instance update failed"
    ]);

    fastify.get("/bill-instances", financeAccess, async(request, reply) => {
        const ownerUserId = request.user.sub;
        const billInstances = await billInstancesService.listBillInstances(ownerUserId);

        return reply.send({data: billInstances});
    });

    fastify.get("/bill-instances/:id", financeAccess, async(request, reply) => {
        try {
            const params = billInstanceParamsSchema.parse(request.params);
            const ownerUserId = request.user.sub;

            const billInstance = await billInstancesService.getBillInstanceById(params.id, ownerUserId);

            return reply.send({data: billInstance});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "Bill instance not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.post("/bill-instances", financeAccess, async(request, reply) => {
        try {
            const body = createBillInstanceSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const billInstance = await billInstancesService.createBillInstance(body, ownerUserId);

            return reply.status(201).send({data: billInstance});
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

    fastify.patch("/bill-instances/:id", financeAccess, async(request, reply) => {
        try {
            const params = billInstanceParamsSchema.parse(request.params);
            const body = updateBillInstanceSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const billInstance = await billInstancesService.updateBillInstance(params.id, ownerUserId, body);

            return reply.send({data: billInstance})
        } catch (error) {
            if (error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request",
                    details: z.treeifyError(error)
                });
            };
            
            if (error instanceof Error && error.message === "Bill instance not found") {
                return reply.status(404).send({
                    error: error.message,
                });
                }

            if(error instanceof Error && badRequestErrors.has(error.message)
                ){
                return reply.status(400).send({
                    error: error.message
                })
            }
            
            throw error;
        }
    })

    fastify.delete("/bill-instances/:id", financeAccess, async(request, reply) => {
        try {
            const params = billInstanceParamsSchema.parse(request.params);
            const ownerUserId = request.user.sub;

            const deletedBillInstance = await billInstancesService.deleteBillInstance(params.id, ownerUserId)

            return reply.status(204).send()
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "Bill instance not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    })
}

export default billInstancesRoutes;