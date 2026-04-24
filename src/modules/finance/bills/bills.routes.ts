import type {FastifyPluginAsync} from "fastify";
import { BillsService } from "./bills.service.js";
import {billIdParamsSchema, createBillSchema, updateBillSchema} from "./bills.schemas.js";
import {z, ZodError} from "zod";

const billsRoutes: FastifyPluginAsync = async (fastify)=> {
    const billsService = new BillsService(fastify.orm);

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    const badRequestErrors = new Set([
        "One-time bills require a due date",
        "Monthly bills require a due day of month",
        "Due day of month can only be used with monthly bills",
        "Linked account not found",
    ])

    fastify.get("/bills", financeAccess, async (request, reply) => {
        const ownerUserId = request.user.sub;
        const bills = await billsService.listBills(ownerUserId);

        return reply.send({data: bills});
    })

    fastify.get("/bills/:id", financeAccess, async(request, reply) => {
        try{
            const params = billIdParamsSchema.parse(request.params);
            const ownerUserId = request.user.sub;

            const bill = await billsService.getBillById(params.id, ownerUserId);

            return reply.send({data: bill});
        } catch(error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "Bill not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    });

    fastify.post("/bills", financeAccess, async(request, reply) => {
        try {
            const body = createBillSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const bill = await billsService.createBill(body, ownerUserId);

            return reply.status(201).send({data: bill});
            
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

            if(error instanceof Error && error.message === "Bill name already exists"){
                return reply.status(409).send({
                    error: error.message
                })
            }

            throw error;
        }
    });

    fastify.patch("/bills/:id", financeAccess, async(request, reply) => {
        try {
            const params = billIdParamsSchema.parse(request.params);
            const body = updateBillSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const bill = await billsService.updateBill(
                params.id,
                ownerUserId,
                body
            )
            
            return reply.send({data: bill});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && badRequestErrors.has(error.message)){
                return reply.status(400).send({
                    error: error.message
                })
            }

            if(error instanceof Error && error.message === "Bill not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            if(error instanceof Error && error.message === "Bill name already exists"){
                return reply.status(409).send({
                    error: error.message
                })
            }

            throw error;
        }
    })
}

export default billsRoutes;